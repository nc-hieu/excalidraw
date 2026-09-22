import type { FastifyPluginAsync } from "fastify";
import type {
  SyncDocumentBody,
  UpdateDocumentBody,
} from "../types/index.js";

export const documentRoutes: FastifyPluginAsync = async (fastify) => {
  // All document routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // GET /api/documents - List all user documents (metadata only)
  fastify.get("/", async (request, reply) => {
    const documents = await fastify.prisma.document.findMany({
      where: { userId: request.user.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });

    const formatted = documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      activePageId: doc.activePageId,
      pageCount: doc._count.pages,
      shareMode: doc.shareMode,
      shareToken: doc.shareToken,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return reply.send({ documents: formatted });
  });

  // POST /api/documents - Create a new document
  fastify.post<{ Body: { name?: string } }>("/", async (request, reply) => {
    const { name } = request.body || {};
    const defaultPageId = `page_${Date.now()}`;

    const document = await fastify.prisma.document.create({
      data: {
        userId: request.user.userId,
        name: name?.trim() || "Bản vẽ 1",
        activePageId: defaultPageId,
        pages: {
          create: {
            id: defaultPageId,
            name: "Trang 1",
            elements: [],
            appState: {},
            files: {},
            orderIndex: 0,
          },
        },
      },
      include: {
        pages: true,
      },
    });

    return reply.code(201).send({
      message: "Tạo bản vẽ thành công",
      document,
    });
  });

  // GET /api/documents/:id - Get document details with full pages & elements
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;

    const document = await fastify.prisma.document.findFirst({
      where: {
        id,
        userId: request.user.userId,
      },
      include: {
        pages: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!document) {
      return reply.code(404).send({
        error: "Not Found",
        message: "Không tìm thấy bản vẽ",
      });
    }

    return reply.send({ document });
  });

  // PUT /api/documents/:id - Update metadata
  fastify.put<{ Params: { id: string }; Body: UpdateDocumentBody }>(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { name, activePageId } = request.body || {};

      const existing = await fastify.prisma.document.findFirst({
        where: { id, userId: request.user.userId },
      });

      if (!existing) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Không tìm thấy bản vẽ",
        });
      }

      const updated = await fastify.prisma.document.update({
        where: { id },
        data: {
          name: name ? name.trim() : undefined,
          activePageId: activePageId || undefined,
        },
      });

      return reply.send({
        message: "Cập nhật bản vẽ thành công",
        document: updated,
      });
    },
  );

  // PUT /api/documents/:id/sync - Sync entire document snapshot (pages & elements)
  fastify.put<{ Params: { id: string }; Body: SyncDocumentBody }>(
    "/:id/sync",
    async (request, reply) => {
      const { id } = request.params;
      const { name, activePageId, pages } = request.body || {};

      if (!Array.isArray(pages) || pages.length === 0) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Danh sách trang (pages) không được để trống",
        });
      }

      const existing = await fastify.prisma.document.findFirst({
        where: { id, userId: request.user.userId },
      });

      if (!existing) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Không tìm thấy bản vẽ để đồng bộ",
        });
      }

      const incomingPageIds = pages.map((p) => p.id);

      // Atomic sync via Prisma Transaction
      const syncedDocument = await fastify.prisma.$transaction(async (tx) => {
        // 1. Update document root attributes
        await tx.document.update({
          where: { id },
          data: {
            name: name?.trim() || existing.name,
            activePageId: activePageId || existing.activePageId,
            updatedAt: new Date(),
          },
        });

        // 2. Delete pages that were removed on the client
        await tx.page.deleteMany({
          where: {
            documentId: id,
            id: { notIn: incomingPageIds },
          },
        });

        // 3. Upsert each incoming page
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          await tx.page.upsert({
            where: {
              documentId_id: {
                documentId: id,
                id: p.id,
              },
            },
            create: {
              id: p.id,
              documentId: id,
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

        // Return refreshed document
        return tx.document.findUnique({
          where: { id },
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

  // DELETE /api/documents/:id - Delete document
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;

    const existing = await fastify.prisma.document.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existing) {
      return reply.code(404).send({
        error: "Not Found",
        message: "Không tìm thấy bản vẽ",
      });
    }

    await fastify.prisma.document.delete({
      where: { id },
    });

    return reply.send({
      message: "Xóa bản vẽ thành công",
      id,
    });
  });
};
