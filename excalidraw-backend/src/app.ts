import fastify from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { documentRoutes } from "./routes/documents.js";
import { shareRoutes } from "./routes/share.js";

export const buildApp = async () => {
  const app = fastify({
    logger: process.env.NODE_ENV === "development",
    bodyLimit: 50 * 1024 * 1024, // 50MB for Excalidraw scenes with images
  });

  // CORS
  const corsOrigins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim());

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (
        corsOrigins.includes("*") ||
        corsOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return cb(null, true);
      }

      try {
        const { hostname } = new URL(origin);
        if (
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
          /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
          /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
        ) {
          return cb(null, true);
        }
      } catch {
        // ignore url parse error
      }

      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  app.setErrorHandler((error: any, request, reply) => {
    console.error(`[API Error] ${request.method} ${request.url}:`, error);
    const statusCode = error?.statusCode || 500;
    reply.status(statusCode).send({
      statusCode,
      error: error?.name || "Internal Server Error",
      message: error?.message || "Đã xảy ra lỗi máy chủ",
    });
  });

  // Plugins
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(documentRoutes, { prefix: "/api/documents" });
  await app.register(shareRoutes, { prefix: "/api" });

  return app;
};
