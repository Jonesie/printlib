import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, ModelSummary } from "@printlib/shared";
import { api } from "../api/client";
import UploadDropzone from "../components/UploadDropzone";
import CategoryManager from "../components/CategoryManager";
import SiteLinksPanel from "../components/SiteLinksPanel";
import StarRating from "../components/StarRating";
import { useAuth } from "../auth/AuthContext";

export default function Library() {
  const { authenticated } = useAuth();
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [modelsRes, categoriesRes] = await Promise.all([
      api.listModels({ search: search || undefined, categoryId: categoryId ? Number(categoryId) : undefined }),
      api.listCategories(),
    ]);
    setModels(modelsRes);
    setCategories(categoriesRes);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId]);

  return (
    <div className="grid gap-6">
      <SiteLinksPanel />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 gap-3">
          <input
            className="min-w-[200px] flex-1 rounded bg-slate-800 px-3 py-2"
            placeholder="Search models…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded bg-slate-800 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {authenticated && <UploadDropzone categories={categories} onUploaded={refresh} />}
      </div>

      {authenticated && <CategoryManager categories={categories} onChanged={refresh} />}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : models.length === 0 ? (
        <p className="text-slate-400">No models yet. Add your first one above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((model) => (
            <Link
              key={model.id}
              to={`/models/${model.id}`}
              className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-sky-600"
            >
              {model.previewFilename ? (
                <img
                  src={api.previewUrl(model.previewFilename)}
                  alt={model.name}
                  className="mb-2 h-28 w-full rounded object-cover"
                />
              ) : (
                <div className="mb-2 flex items-center justify-center rounded bg-slate-800 py-8 text-3xl">
                  🧊
                </div>
              )}
              <h3 className="truncate font-medium">{model.name}</h3>
              <StarRating rating={model.rating} size="text-xs" />
              <p className="truncate text-sm text-slate-400">
                {model.category?.name ?? "Uncategorized"} · {model.fileCount} file
                {model.fileCount === 1 ? "" : "s"}
              </p>
              {model.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {model.tags.map((t) => (
                    <span key={t.id} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              {authenticated && model.printCount > 0 && (
                <p className="mt-2 text-xs text-emerald-400">
                  Printed {model.printCount}× · last {new Date(model.lastPrintedAt!).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
