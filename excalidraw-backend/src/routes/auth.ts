import bcrypt from "bcryptjs";
import type { FastifyPluginAsync } from "fastify";
import type { RegisterBody, LoginBody } from "../types/index.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/register
  fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
    const { email, password, name } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({
        error: "Bad Request",
        message: "Email và mật khẩu là bắt buộc",
      });
    }

    if (password.length < 6) {
      return reply.code(400).send({
        error: "Bad Request",
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await fastify.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return reply.code(409).send({
        error: "Conflict",
        message: "Email này đã được đăng ký",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await fastify.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return reply.code(201).send({
      message: "Đăng ký tài khoản thành công",
      token,
      user,
    });
  });

  // POST /api/auth/login
  fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({
        error: "Bad Request",
        message: "Email và mật khẩu là bắt buộc",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await fastify.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return reply.send({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  });

  // GET /api/auth/me
  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Người dùng không tồn tại",
        });
      }

      return reply.send({ user });
    },
  );
};
