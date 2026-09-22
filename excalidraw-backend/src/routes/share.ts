import crypto from "crypto";
import type { FastifyPluginAsync } from "fastify";
import type { ShareDocumentBody, SyncDocumentBody } from "../types/index.js";

export const shareRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/documents/:id/share - Generate or configure share link (Requires auth)
  fastify.post<{ Params: { id: string }; Body: ShareDocumentBody }>(
    "/documents/:id/share",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { shareMode } = request.body || {};

      if (!["view", "edit", "private"].includes(shareMode)) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Chế độ chia sẻ không hợp lệ (view, edit, private)",
        });
      }

      const existing = await fastify.prisma.document.findFirst({
        where: { id, userId: request.user.userId },
      });

      if (!existing) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Không tìm thấy bản vẽ",
        });
      }

      let shareToken = existing.shareToken;
      if (shareMode !== "private" && !shareToken) {
        shareToken = crypto.randomBytes(16).toString("hex");
      }

      const updated = await fastify.prisma.document.update({
        where: { id },
        data: {
          shareMode,
          shareToken: shareMode === "private" ? null : shareToken,
        },
      });

      return reply.send({
        message: "Cập nhật liên kết chia sẻ thành công",
        shareMode: updated.shareMode,
        shareToken: updated.shareToken,
      });
    },
  );

  // GET /api/share/:token - Access shared document without logging in
  fastify.get<{ Params: { token: string } }>(
    "/share/:token",
    async (request, reply) => {
      const { token } = request.params;

      const document = await fastify.prisma.document.findUnique({
        where: { shareToken: token },
        include: {
          pages: {
            orderBy: { orderIndex: "asc" },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!document || document.shareMode === "private") {
        return reply.code(404).send({
          error: "Not Found",
          message: "Liên kết chia sẻ không tồn tại hoặc đã bị đóng",
        });
      }

      return reply.send({
        document,
        permission: document.shareMode, // "view" | "edit"
      });
    },
  );

  // PUT /api/share/:token/sync - Guest sync if permission is 'edit'
  fastify.put<{ Params: { token: string }; Body: SyncDocumentBody }>(
    "/share/:token/sync",
    async (request, reply) => {
      const { token } = request.params;
      const { name, activePageId, pages } = request.body || {};

      if (!Array.isArray(pages) || pages.length === 0) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Danh sách trang không được để trống",
        });
      }

      const existing = await fastify.prisma.document.findUnique({
        where: { shareToken: token },
      });

      if (!existing || existing.shareMode === "private") {
        return reply.code(404).send({
          error: "Not Found",
          message: "Liên kết chia sẻ không tồn tại",
        });
      }

      if (existing.shareMode !== "edit") {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Bạn chỉ có quyền xem, không được phép chỉnh sửa bản vẽ này",
        });
      }

      const incomingPageIds = pages.map((p) => p.id);

      const syncedDocument = await fastify.prisma.$transaction(async (tx) => {
        await tx.document.update({
          where: { id: existing.id },
          data: {
            name: name?.trim() || existing.name,
            activePageId: activePageId || existing.activePageId,
            updatedAt: new Date(),
          },
        });

        await tx.page.deleteMany({
          where: {
            documentId: existing.id,
            id: { notIn: incomingPageIds },
          },
        });

        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          await tx.page.upsert({
            where: {
              documentId_id: {
                documentId: existing.id,
                id: p.id,
              },
            },
            create: {
              id: p.id,
              documentId: existing.id,
              name: p.name || `Trang ${i + 1}`,
              elements: p.elements || [],
              appState: p.appState || {},
              files: p.files || {},
              orderIndex: p.orderIndex ?? i,
            },
            update: {
              name: p.name || undefined,
              elements: p.elements || [],
              appState: p.appState || {},
              files: p.files || {},
              orderIndex: p.orderIndex ?? i,
              updatedAt: new Date(),
            },
          });
        }

        return tx.document.findUnique({
          where: { id: existing.id },
          include: {
            pages: {
              orderBy: { orderIndex: "asc" },
            },
          },
        });
      });

      return reply.send({
        message: "Đồng bộ bản vẽ thành công",
        document: syncedDocument,
      });
    },
  );
};
