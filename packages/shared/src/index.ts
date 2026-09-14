import { z } from "zod";

export const FILE_TYPES = [
  "stl",
  "3mf",
  "obj",
  "gcode",
  "step",
  "image",
  "other",
] as const;
export type FileType = (typeof FILE_TYPES)[number];

export function classifyFileType(filename: string): FileType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "stl") return "stl";
  if (ext === "3mf") return "3mf";
  if (ext === "obj") return "obj";
  if (ext === "gcode" || ext === "gco" || ext === "g") return "gcode";
  if (ext === "step" || ext === "stp") return "step";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  return "other";
}

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;

export const siteLinkSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
});
export type SiteLink = z.infer<typeof siteLinkSchema>;

export const printerSchema = z.object({
  id: z.number(),
  name: z.string(),
  model: z.string().nullable(),
  purchasedAt: z.string().nullable(),
  price: z.number().nullable(),
  photoFilename: z.string().nullable(),
  notes: z.string().nullable(),
});
export type Printer = z.infer<typeof printerSchema>;

export const socialLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

export const profileSchema = z.object({
  name: z.string(),
  avatarFilename: z.string().nullable(),
  location: z.string().nullable(),
  note: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  socialLinks: z.array(socialLinkSchema),
});
export type Profile = z.infer<typeof profileSchema>;

export const modelFileSchema = z.object({
  id: z.number(),
  modelId: z.number(),
  filename: z.string(),
  fileType: z.enum(FILE_TYPES),
  sizeBytes: z.number(),
});
export type ModelFile = z.infer<typeof modelFileSchema>;

export const printLogSchema = z.object({
  id: z.number(),
  modelId: z.number(),
  createdAt: z.string(),
  success: z.boolean(),
  notes: z.string().nullable(),
  photoFilename: z.string().nullable(),
  printerName: z.string().nullable(),
  material: z.string().nullable(),
});
export type PrintLog = z.infer<typeof printLogSchema>;

export const modelSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  category: categorySchema.nullable(),
  tags: z.array(tagSchema),
  fileCount: z.number(),
  primaryFileType: z.enum(FILE_TYPES).nullable(),
  printCount: z.number(),
  lastPrintedAt: z.string().nullable(),
  previewFilename: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  rating: z.number().min(1).max(5).nullable(),
});
export type ModelSummary = z.infer<typeof modelSummarySchema>;

export const modelDetailSchema = modelSummarySchema.extend({
  files: z.array(modelFileSchema),
  printLogs: z.array(printLogSchema),
});
export type ModelDetail = z.infer<typeof modelDetailSchema>;

export const versionStatusSchema = z.object({
  current: z.string(),
  latest: z.string().nullable(),
  updateAvailable: z.boolean(),
  releaseUrl: z.string().nullable(),
});
export type VersionStatus = z.infer<typeof versionStatusSchema>;
