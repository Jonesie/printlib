import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, ModelSummary } from "@printlib/shared";
import { api } from "../api/client";
import UploadDropzone from "../components/UploadDropzone";
import CategoryManager from "../components/CategoryManager";
import SiteLinksPanel from "../components/SiteLinksPanel";
import PrintersPanel from "../components/PrintersPanel";
import ProfilePanel from "../components/ProfilePanel";
import StarRating from "../components/StarRating";
import Lightbox from "../components/Lightbox";
import { useAuth } from "../auth/AuthContext";

type SortBy = "date-desc" | "date-asc" | "name";
const SORT_STORAGE_KEY = "printlib-sort";

function readStoredSort(): SortBy {
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    if (stored === "date-desc" || stored === "date-asc" || stored === "name") return stored;
  } catch {
    // localStorage unavailable — fall back silently
  }
  return "date-desc";
}

export default function Library() {
  const { authenticated } = useAuth();
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>(readStoredSort);
  const [minRating, setMinRating] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, sortBy);
    } catch {
      // ignore — sort still applies this session, just won't persist
    }
  }, [sortBy]);

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

  const visibleModels = models
    .filter((m) => !minRating || (m.rating ?? 0) >= Number(minRating))
    .slice()
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date-asc") return a.createdAt.localeCompare(b.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_260px] lg:items-start">
      <div className="order-1 lg:sticky lg:top-6">
        <ProfilePanel />
      </div>

      <PrintersPanel />

      <div className="order-3 grid gap-6 lg:order-2">
        <SiteLinksPanel />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap gap-3">
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
            <select
              className="rounded bg-slate-800 px-3 py-2"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="">Any rating</option>
              <option value="1">★ 1+</option>
              <option value="2">★★ 2+</option>
              <option value="3">★★★ 3+</option>
              <option value="4">★★★★ 4+</option>
              <option value="5">★★★★★ 5</option>
            </select>
            <select
              className="rounded bg-slate-800 px-3 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
          {authenticated && <UploadDropzone categories={categories} onUploaded={refresh} />}
        </div>

        {authenticated && <CategoryManager categories={categories} onChanged={refresh} />}

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : models.length === 0 ? (
          <p className="text-slate-400">No models yet. Add your first one above.</p>
        ) : visibleModels.length === 0 ? (
          <p className="text-slate-400">No models match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {visibleModels.map((model) => (
              <Link
                key={model.id}
                to={`/models/${model.id}`}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-sky-600"
              >
                {model.previewFilename ? (
                  <img
                    src={api.previewUrl(model.previewFilename)}
                    alt={model.name}
                    onClick={(e) => {
                      e.preventDefault();
                      setLightboxSrc(api.previewUrl(model.previewFilename!));
                    }}
                    className="mb-2 aspect-square w-full cursor-zoom-in rounded bg-slate-800 object-contain"
                  />
                ) : (
                  <div className="mb-2 flex aspect-square w-full items-center justify-center rounded bg-slate-800 text-3xl">
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

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
