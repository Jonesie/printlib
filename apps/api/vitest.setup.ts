import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

// A fresh DB directory per test FILE (not once for the whole worker) — each
// file gets its own isolated module graph, so if they shared a DATA_DIR
// they'd all open the same SQLite file at once and lock each other out.
process.env.DATA_DIR = path.join(os.tmpdir(), `printlib-test-${crypto.randomUUID()}`);
