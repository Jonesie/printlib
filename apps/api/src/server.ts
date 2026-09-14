import { buildApp } from "./app.js";
import { HOST, PORT } from "./config.js";
import { startVersionCheckScheduler } from "./lib/versionCheck.js";

const app = buildApp();

app
  .listen({ host: HOST, port: PORT })
  .then(() => startVersionCheckScheduler())
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
