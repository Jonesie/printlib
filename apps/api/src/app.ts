import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import "./db/index.js";
import { WEB_DIST_DIR } from "./config.js";
import modelsRoutes from "./routes/models.js";
import categoriesRoutes from "./routes/categories.js";
import tagsRoutes from "./routes/tags.js";
import printLogsRoutes from "./routes/printLogs.js";
import filesRoutes from "./routes/files.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(fastifyCors, { origin: true });
  app.register(fastifyMultipart, {
    limits: { fileSize: 500 * 1024 * 1024 },
  });

  app.register(modelsRoutes);
  app.register(categoriesRoutes);
  app.register(tagsRoutes);
  app.register(printLogsRoutes);
  app.register(filesRoutes);

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
