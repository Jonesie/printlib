import type { Category, ModelDetail, ModelSummary, Tag } from "@printlib/shared";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
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

  updateModel(id: number, data: { name?: string; description?: string | null; categoryId?: number | null; tags?: string[] }) {
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

  fileDownloadUrl(fileId: number) {
    return `/api/files/${fileId}/download`;
  },

  printLogPhotoUrl(filename: string) {
    return `/api/print-log-photos/${filename}`;
  },

  previewUrl(filename: string) {
    return `/api/previews/${filename}`;
  },
};
