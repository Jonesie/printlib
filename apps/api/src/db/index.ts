import fs from "node:fs";
import Database from "better-sqlite3";
import { DATA_DIR, DB_PATH, MODELS_DIR, PREVIEWS_DIR, PRINT_LOGS_DIR } from "../config.js";

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(MODELS_DIR, { recursive: true });
fs.mkdirSync(PRINT_LOGS_DIR, { recursive: true });
fs.mkdirSync(PREVIEWS_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS models (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    description    TEXT,
    category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    primary_file_id INTEGER,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS model_files (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id   INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    filename   TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    file_type  TEXT NOT NULL,
    size_bytes INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS model_tags (
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (model_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS print_logs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id       INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    success        INTEGER NOT NULL,
    notes          TEXT,
    photo_filename TEXT,
    printer_name   TEXT,
    material       TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_model_files_model_id ON model_files(model_id);
  CREATE INDEX IF NOT EXISTS idx_print_logs_model_id ON print_logs(model_id);
  CREATE INDEX IF NOT EXISTS idx_models_category_id ON models(category_id);
`);

// Simple additive migration: add columns introduced after the initial
// CREATE TABLE if they're missing from an existing database file.
const modelColumns = db.prepare(`PRAGMA table_info(models)`).all() as { name: string }[];
if (!modelColumns.some((c) => c.name === "preview_filename")) {
  db.exec(`ALTER TABLE models ADD COLUMN preview_filename TEXT`);
}
if (!modelColumns.some((c) => c.name === "source_url")) {
  db.exec(`ALTER TABLE models ADD COLUMN source_url TEXT`);
}
