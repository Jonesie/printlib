import { buildApp } from "./app.js";
import { HOST, PORT } from "./config.js";

const app = buildApp();

app
  .listen({ host: HOST, port: PORT })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
