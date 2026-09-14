import type { FastifyInstance } from "fastify";
import { getVersionStatus } from "../lib/versionCheck.js";

export default async function versionRoutes(app: FastifyInstance) {
  app.get("/api/version", async () => getVersionStatus());
}
