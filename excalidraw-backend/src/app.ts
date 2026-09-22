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
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:3000", "http://localhost:3003"];

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);
      if (
        corsOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
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
