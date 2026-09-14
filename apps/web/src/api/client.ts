import type {
  Category,
  ModelDetail,
  ModelSummary,
  Printer,
  Profile,
  SiteLink,
  Tag,
  VersionStatus,
} from "@printlib/shared";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getSession() {
    return fetch(`/api/session`).then((r) => json<{ authenticated: boolean }>(r));
  },

  getVersionStatus() {
    return fetch(`/api/version`).then((r) => json<VersionStatus>(r));
  },

  login(password: string) {
    return fetch(`/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then((r) => json<{ ok: true }>(r));
  },

  logout() {
    return fetch(`/api/logout`, { method: "POST" }).then((r) => json<{ ok: true }>(r));
  },

  listModels(params: { search?: string; categoryId?: number; tagId?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.categoryId) qs.set("categoryId", String(params.categoryId));
    if (params.tagId) qs.set("tagId", String(params.tagId));
    return fetch(`/api/models?${qs}`).then((r) => json<ModelSummary[]>(r));
  },

  getModel(id: number) {
    return fetch(`/api/models/${id}`).then((r) => json<ModelDetail>(r));
  },

  createModel(form: FormData) {
    return fetch(`/api/models`, { method: "POST", body: form }).then((r) => json<ModelDetail>(r));
  },

  updateModel(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      categoryId?: number | null;
      sourceUrl?: string | null;
      sourceSiteName?: string | null;
      rating?: number | null;
      tags?: string[];
    },
  ) {
    return fetch(`/api/models/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<ModelDetail>(r));
  },

  deleteModel(id: number) {
    return fetch(`/api/models/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Failed to delete model");
    });
  },

  listCategories() {
    return fetch(`/api/categories`).then((r) => json<Category[]>(r));
  },

  createCategory(name: string) {
    return fetch(`/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => json<Category>(r));
  },

  updateCategory(id: number, name: string) {
    return fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => json<Category>(r));
  },

  deleteCategory(id: number) {
    return fetch(`/api/categories/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Failed to delete category");
    });
  },

  listTags() {
    return fetch(`/api/tags`).then((r) => json<Tag[]>(r));
  },

  addPrintLog(modelId: number, form: FormData) {
    return fetch(`/api/models/${modelId}/print-logs`, { method: "POST", body: form }).then((r) =>
      json<ModelDetail>(r),
    );
  },

  updatePrintLog(id: number, form: FormData) {
    return fetch(`/api/print-logs/${id}`, { method: "PATCH", body: form }).then((r) => json<ModelDetail>(r));
  },

  deletePrintLog(id: number) {
    return fetch(`/api/print-logs/${id}`, { method: "DELETE" }).then((r) => json<ModelDetail>(r));
  },

  savePreview(modelId: number, blob: Blob) {
    const form = new FormData();
    form.set("preview", blob, "preview.png");
    return fetch(`/api/models/${modelId}/preview`, { method: "POST", body: form }).then((r) =>
      json<ModelDetail>(r),
    );
  },

  setPreviewFromLog(modelId: number, printLogId: number) {
    return fetch(`/api/models/${modelId}/preview-from-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printLogId }),
    }).then((r) => json<ModelDetail>(r));
  },

  fileDownloadUrl(fileId: number) {
    return `/api/files/${fileId}/download`;
  },

  modelDownloadUrl(modelId: number) {
    return `/api/models/${modelId}/download`;
  },

  printLogPhotoUrl(filename: string) {
    return `/api/print-log-photos/${filename}`;
  },

  previewUrl(filename: string) {
    return `/api/previews/${filename}`;
  },

  listSiteLinks() {
    return fetch(`/api/site-links`).then((r) => json<SiteLink[]>(r));
  },

  createSiteLink(name: string, url: string) {
    return fetch(`/api/site-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    }).then((r) => json<SiteLink>(r));
  },

  updateSiteLink(id: number, data: { name?: string; url?: string }) {
    return fetch(`/api/site-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<SiteLink>(r));
  },

  deleteSiteLink(id: number) {
    return fetch(`/api/site-links/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Failed to delete site link");
    });
  },

  listPrinters() {
    return fetch(`/api/printers`).then((r) => json<Printer[]>(r));
  },

  createPrinter(form: FormData) {
    return fetch(`/api/printers`, { method: "POST", body: form }).then((r) => json<Printer>(r));
  },

  updatePrinter(id: number, form: FormData) {
    return fetch(`/api/printers/${id}`, { method: "PATCH", body: form }).then((r) => json<Printer>(r));
  },

  deletePrinter(id: number) {
    return fetch(`/api/printers/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Failed to delete printer");
    });
  },

  printerPhotoUrl(filename: string) {
    return `/api/printer-photos/${filename}`;
  },

  getProfile() {
    return fetch(`/api/profile`).then((r) => json<Profile | null>(r));
  },

  saveProfile(form: FormData) {
    return fetch(`/api/profile`, { method: "PUT", body: form }).then((r) => json<Profile>(r));
  },

  avatarUrl(filename: string) {
    return `/api/profile-avatar/${filename}`;
  },
};
