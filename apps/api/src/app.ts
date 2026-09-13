import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import "./db/index.js";
import { WEB_DIST_DIR } from "./config.js";
import { isValidSessionToken, SESSION_COOKIE } from "./lib/auth.js";
import authRoutes from "./routes/auth.js";
import modelsRoutes from "./routes/models.js";
import categoriesRoutes from "./routes/categories.js";
import tagsRoutes from "./routes/tags.js";
import printLogsRoutes from "./routes/printLogs.js";
import filesRoutes from "./routes/files.js";
import siteLinksRoutes from "./routes/siteLinks.js";
import printersRoutes from "./routes/printers.js";
import profileRoutes from "./routes/profile.js";

// Reading is public (browse/search/view/download/preview) — only writes
// (uploading, editing, deleting, logging prints) require a session. Login
// and logout are exempt from the write check for the obvious reason: you
// can't already be logged in to log in, and logging out while already
// logged out should just no-op rather than 401.
const PUBLIC_WRITE_ROUTES = new Set(["/api/login", "/api/logout"]);

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(fastifyCors, { origin: true, credentials: true });
  app.register(fastifyCookie);
  app.register(fastifyRateLimit, { global: false });
  app.register(fastifyMultipart, {
    limits: { fileSize: 500 * 1024 * 1024 },
  });

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0];
    if (!path.startsWith("/api/")) return;
    if (request.method === "GET" || PUBLIC_WRITE_ROUTES.has(path)) return;
    if (!isValidSessionToken(request.cookies[SESSION_COOKIE])) {
      return reply.code(401).send({ error: "Not authenticated" });
    }
  });

  app.register(authRoutes);
  app.register(modelsRoutes);
  app.register(categoriesRoutes);
  app.register(tagsRoutes);
  app.register(printLogsRoutes);
  app.register(filesRoutes);
  app.register(siteLinksRoutes);
  app.register(printersRoutes);
  app.register(profileRoutes);

  if (WEB_DIST_DIR) {
    app.register(fastifyStatic, { root: WEB_DIST_DIR });
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
