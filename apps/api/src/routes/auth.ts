import type { FastifyInstance } from "fastify";
import { checkPassword, makeSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, isValidSessionToken } from "../lib/auth.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = request.body as { password?: string };
      if (!body.password || !checkPassword(body.password)) {
        return reply.code(401).send({ error: "Wrong password" });
      }
      reply.setCookie(SESSION_COOKIE, makeSessionToken(), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
      return { ok: true };
    },
  );

  app.post("/api/logout", async (request, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/api/session", async (request) => {
    return { authenticated: isValidSessionToken(request.cookies[SESSION_COOKIE]) };
  });
}
