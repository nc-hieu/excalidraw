import { describe, it, expect, vi, beforeEach } from "vitest";
import fp from "fastify-plugin";

const { mockPrisma, mockUser, mockDocument } = vi.hoisted(() => {
  const user = {
    id: "user-123",
    email: "test@example.com",
    passwordHash: "$2a$10$xyzFakeHashedPassword",
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const doc = {
    id: "doc-123",
    userId: "user-123",
    name: "Drawing 1",
    activePageId: "page-1",
    shareToken: null,
    shareMode: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { pages: 1 },
    pages: [
      {
        id: "page-1",
        documentId: "doc-123",
        name: "Page 1",
        elements: [],
        appState: {},
        files: {},
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const prisma: any = {
    $disconnect: vi.fn(),
    $transaction: vi.fn(async (cb: any) => cb(prisma)),
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    page: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  return { mockPrisma: prisma, mockUser: user, mockDocument: doc };
});

vi.mock("./plugins/prisma.js", () => {
  return {
    prismaClient: mockPrisma,
    default: fp(async (fastify: any) => {
      fastify.decorate("prisma", mockPrisma);
    }),
  };
});

import { buildApp } from "./app.js";

describe("Excalidraw Backend API Suite", () => {
  let app: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  describe("Health Check", () => {
    it("should return 200 and status ok", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.status).toBe("ok");
    });
  });

  describe("Auth Routes", () => {
    it("should reject register without email or password", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "" },
      });

      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error).toBe("Bad Request");
    });

    it("should reject register with short password (< 6 chars)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "user@test.com", password: "123" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should successfully register a new user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "new-user-id",
        email: "user@test.com",
        name: "New User",
        createdAt: new Date(),
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "user@test.com", password: "password123", name: "New User" },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.token).toBeDefined();
      expect(json.user.email).toBe("user@test.com");
    });

    it("should reject register if email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "test@example.com", password: "password123" },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("Protected Document Routes", () => {
    it("should reject unauthenticated request to /api/documents", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/documents",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should list documents for authenticated user", async () => {
      const token = app.jwt.sign({ userId: "user-123", email: "test@example.com" });
      mockPrisma.document.findMany.mockResolvedValue([mockDocument]);

      const res = await app.inject({
        method: "GET",
        url: "/api/documents",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.documents).toHaveLength(1);
      expect(json.documents[0].name).toBe("Drawing 1");
    });

    it("should create a document for authenticated user", async () => {
      const token = app.jwt.sign({ userId: "user-123", email: "test@example.com" });
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const res = await app.inject({
        method: "POST",
        url: "/api/documents",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: { name: "New drawing" },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.document.name).toBe("Drawing 1");
    });

    it("should sync existing document snapshot atomically", async () => {
      const token = app.jwt.sign({ userId: "user-123", email: "test@example.com" });
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockPrisma.document.update.mockResolvedValue(mockDocument);

      const res = await app.inject({
        method: "PUT",
        url: "/api/documents/doc-123/sync",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          name: "Drawing 1",
          activePageId: "page-1",
          pages: [
            {
              id: "page-1",
              name: "Page 1",
              elements: [{ id: "el1", type: "rectangle" }],
              appState: { zoom: { value: 1 } },
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.message).toContain("successfully");
    });

    it("should auto-upsert and create new document when syncing local-first document ID", async () => {
      const token = app.jwt.sign({ userId: "user-123", email: "test@example.com" });
      // When document doesn't exist yet
      mockPrisma.document.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockDocument, id: "local-new-id" });
      mockPrisma.document.create.mockResolvedValue({ ...mockDocument, id: "local-new-id" });

      const res = await app.inject({
        method: "PUT",
        url: "/api/documents/local-new-id/sync",
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          name: "Local Drawing",
          activePageId: "page-local-1",
          pages: [
            {
              id: "page-local-1",
              name: "Page 1",
              elements: [],
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.message).toContain("successfully");
      expect(mockPrisma.document.create).toHaveBeenCalled();
    });
  });

  describe("Share Link Routes", () => {
    it("should return 404 for non-existent share token", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: "GET",
        url: "/api/share/invalid-token",
      });

      expect(res.statusCode).toBe(404);
    });

    it("should return document for valid public share token", async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...mockDocument,
        shareToken: "valid-token-123",
        shareMode: "view",
        user: { name: "Author", email: "author@test.com" },
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/share/valid-token-123",
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.permission).toBe("view");
      expect(json.document.id).toBe("doc-123");
    });
  });
});
