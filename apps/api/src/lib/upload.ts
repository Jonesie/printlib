import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { classifyFileType } from "@printlib/shared";
import { MODELS_DIR } from "../config.js";
import { addModelFile } from "../db/queries.js";

const ZIP_SKIP_PATTERNS = [/^__MACOSX\//, /\/\.DS_Store$/, /(^|\/)\.DS_Store$/, /\/$/];

function isJunkZipEntry(entryName: string): boolean {
  return ZIP_SKIP_PATTERNS.some((re) => re.test(entryName));
}

/**
 * Saves an uploaded buffer for a model. Zips are extracted so each contained
 * file becomes its own ModelFile row under the same model; anything else is
 * stored as a single file.
 */
export function storeUpload(modelId: number, originalFilename: string, buffer: Buffer): void {
  const modelDir = path.join(MODELS_DIR, String(modelId));
  fs.mkdirSync(modelDir, { recursive: true });

  const ext = originalFilename.split(".").pop()?.toLowerCase();
  if (ext === "zip") {
    const zip = new AdmZip(buffer);
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || isJunkZipEntry(entry.entryName)) continue;
      const filename = path.basename(entry.entryName);
      if (!filename) continue;
      const storedName = `${crypto.randomUUID()}-${filename}`;
      const storedPath = path.join(modelDir, storedName);
      const data = entry.getData();
      fs.writeFileSync(storedPath, data);
      addModelFile({
        modelId,
        filename,
        storedPath,
        fileType: classifyFileType(filename),
        sizeBytes: data.length,
      });
    }
  } else {
    const storedName = `${crypto.randomUUID()}-${originalFilename}`;
    const storedPath = path.join(modelDir, storedName);
    fs.writeFileSync(storedPath, buffer);
    addModelFile({
      modelId,
      filename: originalFilename,
      storedPath,
      fileType: classifyFileType(originalFilename),
      sizeBytes: buffer.length,
    });
  }
}
