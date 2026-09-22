import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaClient = new PrismaClient();

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("prisma", prismaClient);

  fastify.addHook("onClose", async () => {
    await prismaClient.$disconnect();
  });
};

export default fp(prismaPlugin);
