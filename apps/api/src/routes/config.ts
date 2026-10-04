import type { FastifyInstance } from "fastify";
import { BUYMEACOFFEE_USERNAME, SHOW_GET_PRINTLIB_PANEL } from "../config.js";

export default async function configRoutes(app: FastifyInstance) {
  // Operator settings the frontend needs to know about.
  app.get("/api/config", async () => ({
    showGetPrintLibPanel: SHOW_GET_PRINTLIB_PANEL,
    buyMeACoffeeUrl: BUYMEACOFFEE_USERNAME
      ? `https://buymeacoffee.com/${encodeURIComponent(BUYMEACOFFEE_USERNAME)}`
      : null,
  }));
}
