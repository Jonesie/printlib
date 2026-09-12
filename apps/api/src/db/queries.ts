import type { Category, ModelDetail, ModelFile, ModelSummary, PrintLog, Tag } from "@printlib/shared";
import { db } from "./index.js";

function rowToCategory(row: any): Category {
  return { id: row.id, name: row.name };
}

function rowToTag(row: any): Tag {
  return { id: row.id, name: row.name };
}

function rowToModelFile(row: any): ModelFile {
  return {
    id: row.id,
    modelId: row.model_id,
    filename: row.filename,
    fileType: row.file_type,
    sizeBytes: row.size_bytes,
  };
}

function rowToPrintLog(row: any): PrintLog {
  return {
    id: row.id,
    modelId: row.model_id,
    createdAt: row.created_at,
    success: !!row.success,
    notes: row.notes,
    photoFilename: row.photo_filename,
    printerName: row.printer_name,
    material: row.material,
  };
}

function getTagsForModel(modelId: number): Tag[] {
  const rows = db
    .prepare(
      `SELECT t.id, t.name FROM tags t
       JOIN model_tags mt ON mt.tag_id = t.id
       WHERE mt.model_id = ?
       ORDER BY t.name`,
    )
    .all(modelId);
  return rows.map(rowToTag);
}

function toSummary(row: any): ModelSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    tags: getTagsForModel(row.id),
    fileCount: row.file_count,
    primaryFileType: row.primary_file_type ?? null,
    printCount: row.print_count,
    lastPrintedAt: row.last_printed_at,
    previewFilename: row.preview_filename ?? null,
  };
}

const summaryBaseQuery = `
  SELECT
    m.id, m.name, m.description, m.created_at, m.category_id, m.preview_filename,
    c.name AS category_name,
    (SELECT COUNT(*) FROM model_files mf WHERE mf.model_id = m.id) AS file_count,
    (SELECT mf.file_type FROM model_files mf WHERE mf.model_id = m.id
       ORDER BY (mf.file_type = 'stl') DESC, (mf.file_type = '3mf') DESC, mf.id ASC LIMIT 1) AS primary_file_type,
    (SELECT COUNT(*) FROM print_logs pl WHERE pl.model_id = m.id) AS print_count,
    (SELECT MAX(pl.created_at) FROM print_logs pl WHERE pl.model_id = m.id) AS last_printed_at
  FROM models m
  LEFT JOIN categories c ON c.id = m.category_id
`;

export interface ModelFilters {
  search?: string;
  categoryId?: number;
  tagId?: number;
}

export function listModels(filters: ModelFilters): ModelSummary[] {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.search) {
    clauses.push("(m.name LIKE @search OR m.description LIKE @search)");
    params.search = `%${filters.search}%`;
  }
  if (filters.categoryId) {
    clauses.push("m.category_id = @categoryId");
    params.categoryId = filters.categoryId;
  }
  if (filters.tagId) {
    clauses.push("m.id IN (SELECT model_id FROM model_tags WHERE tag_id = @tagId)");
    params.tagId = filters.tagId;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db.prepare(`${summaryBaseQuery} ${where} ORDER BY m.created_at DESC`).all(params);
  return rows.map(toSummary);
}

export function getModelDetail(id: number): ModelDetail | null {
  const row = db.prepare(`${summaryBaseQuery} WHERE m.id = @id`).get({ id });
  if (!row) return null;

  const files = db
    .prepare(`SELECT * FROM model_files WHERE model_id = ? ORDER BY id`)
    .all(id)
    .map(rowToModelFile);

  const printLogs = db
    .prepare(`SELECT * FROM print_logs WHERE model_id = ? ORDER BY created_at DESC`)
    .all(id)
    .map(rowToPrintLog);

  return { ...toSummary(row), files, printLogs };
}

export function createModel(input: { name: string; description?: string | null; categoryId?: number | null }): number {
  const result = db
    .prepare(`INSERT INTO models (name, description, category_id) VALUES (?, ?, ?)`)
    .run(input.name, input.description ?? null, input.categoryId ?? null);
  return Number(result.lastInsertRowid);
}

export function updateModel(
  id: number,
  input: { name?: string; description?: string | null; categoryId?: number | null },
): void {
  const current = db.prepare(`SELECT * FROM models WHERE id = ?`).get(id) as any;
  if (!current) throw new Error("Model not found");
  db.prepare(`UPDATE models SET name = ?, description = ?, category_id = ? WHERE id = ?`).run(
    input.name ?? current.name,
    input.description !== undefined ? input.description : current.description,
    input.categoryId !== undefined ? input.categoryId : current.category_id,
    id,
  );
}

export function deleteModel(id: number): void {
  db.prepare(`DELETE FROM models WHERE id = ?`).run(id);
}

export function setModelPreview(id: number, filename: string): void {
  db.prepare(`UPDATE models SET preview_filename = ? WHERE id = ?`).run(filename, id);
}

export function addModelFile(input: {
  modelId: number;
  filename: string;
  storedPath: string;
  fileType: string;
  sizeBytes: number;
}): number {
  const result = db
    .prepare(
      `INSERT INTO model_files (model_id, filename, stored_path, file_type, size_bytes) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.modelId, input.filename, input.storedPath, input.fileType, input.sizeBytes);
  return Number(result.lastInsertRowid);
}

export function getModelFile(id: number): (ModelFile & { storedPath: string }) | null {
  const row = db.prepare(`SELECT * FROM model_files WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return { ...rowToModelFile(row), storedPath: row.stored_path };
}

export function listCategories(): Category[] {
  return db.prepare(`SELECT * FROM categories ORDER BY name`).all().map(rowToCategory);
}

export function createCategory(name: string): Category {
  const result = db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`).run(name);
  const id = result.lastInsertRowid
    ? Number(result.lastInsertRowid)
    : (db.prepare(`SELECT id FROM categories WHERE name = ?`).get(name) as any).id;
  return { id, name };
}

export function updateCategory(id: number, name: string): Category {
  db.prepare(`UPDATE categories SET name = ? WHERE id = ?`).run(name, id);
  return { id, name };
}

export function deleteCategory(id: number): void {
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
}

export function listTags(): Tag[] {
  return db.prepare(`SELECT * FROM tags ORDER BY name`).all().map(rowToTag);
}

export function findOrCreateTag(name: string): Tag {
  const trimmed = name.trim();
  db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).run(trimmed);
  const row = db.prepare(`SELECT * FROM tags WHERE name = ?`).get(trimmed) as any;
  return rowToTag(row);
}

export function setModelTags(modelId: number, tagNames: string[]): void {
  db.prepare(`DELETE FROM model_tags WHERE model_id = ?`).run(modelId);
  for (const name of tagNames) {
    const tag = findOrCreateTag(name);
    db.prepare(`INSERT OR IGNORE INTO model_tags (model_id, tag_id) VALUES (?, ?)`).run(modelId, tag.id);
  }
}

export function addPrintLog(input: {
  modelId: number;
  success: boolean;
  notes?: string | null;
  photoFilename?: string | null;
  printerName?: string | null;
  material?: string | null;
  createdAt?: string | null;
}): number {
  if (input.createdAt) {
    const result = db
      .prepare(
        `INSERT INTO print_logs (model_id, success, notes, photo_filename, printer_name, material, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.modelId,
        input.success ? 1 : 0,
        input.notes ?? null,
        input.photoFilename ?? null,
        input.printerName ?? null,
        input.material ?? null,
        input.createdAt,
      );
    return Number(result.lastInsertRowid);
  }
  const result = db
    .prepare(
      `INSERT INTO print_logs (model_id, success, notes, photo_filename, printer_name, material)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.modelId,
      input.success ? 1 : 0,
      input.notes ?? null,
      input.photoFilename ?? null,
      input.printerName ?? null,
      input.material ?? null,
    );
  return Number(result.lastInsertRowid);
}

export function getPrintLog(id: number): PrintLog | null {
  const row = db.prepare(`SELECT * FROM print_logs WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return rowToPrintLog(row);
}

export function updatePrintLog(
  id: number,
  input: {
    success?: boolean;
    notes?: string | null;
    photoFilename?: string | null;
    printerName?: string | null;
    material?: string | null;
    createdAt?: string;
  },
): void {
  const current = db.prepare(`SELECT * FROM print_logs WHERE id = ?`).get(id) as any;
  if (!current) throw new Error("Print log not found");
  db.prepare(
    `UPDATE print_logs SET success = ?, notes = ?, photo_filename = ?, printer_name = ?, material = ?, created_at = ?
     WHERE id = ?`,
  ).run(
    input.success !== undefined ? (input.success ? 1 : 0) : current.success,
    input.notes !== undefined ? input.notes : current.notes,
    input.photoFilename !== undefined ? input.photoFilename : current.photo_filename,
    input.printerName !== undefined ? input.printerName : current.printer_name,
    input.material !== undefined ? input.material : current.material,
    input.createdAt ?? current.created_at,
    id,
  );
}

export function deletePrintLog(id: number): void {
  db.prepare(`DELETE FROM print_logs WHERE id = ?`).run(id);
}
