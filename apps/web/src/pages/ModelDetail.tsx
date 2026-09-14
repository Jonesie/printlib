import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Category, ModelDetail as ModelDetailType } from "@printlib/shared";
import { detectSourceSiteName } from "@printlib/shared";
import { api } from "../api/client";
import Viewer3D from "../components/Viewer3D";
import TagEditor from "../components/TagEditor";
import PrintLogForm, { EditPrintLogForm } from "../components/PrintLogForm";
import StarRating from "../components/StarRating";
import Lightbox from "../components/Lightbox";
import SourcePill from "../components/SourcePill";
import { useAuth } from "../auth/AuthContext";

export default function ModelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const [model, setModel] = useState<ModelDetailType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceSiteName, setSourceSiteName] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  async function refresh() {
    const m = await api.getModel(Number(id));
    setModel(m);
    setName(m.name);
    setDescription(m.description ?? "");
    setCategoryId(m.category ? String(m.category.id) : "");
    setSourceUrl(m.sourceUrl ?? "");
    setSourceSiteName(m.sourceSiteName ?? "");
  }

  useEffect(() => {
    refresh();
    if (authenticated) api.listCategories().then(setCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authenticated]);

  if (!model) return <p className="text-slate-400">Loading…</p>;

  const stlFile = model.files.find((f) => f.fileType === "stl");

  async function deleteModelAndGoHome() {
    if (!confirm(`Delete "${model!.name}"? This removes its files too.`)) return;
    await api.deleteModel(model!.id);
    navigate("/");
  }

  const trimmedSourceUrl = sourceUrl.trim();
  const detectedSiteName = trimmedSourceUrl ? detectSourceSiteName(trimmedSourceUrl) : null;
  const needsManualSiteName = Boolean(trimmedSourceUrl) && !detectedSiteName;

  async function saveModelFields() {
    if (!trimmedSourceUrl && model!.files.length === 0) {
      setSaveError("A model needs at least a source URL or files.");
      return;
    }
    if (needsManualSiteName && !sourceSiteName.trim()) {
      setSaveError("This source URL isn't from a site we recognize — please name the site it's from.");
      return;
    }
    setSaveError(null);
    setSavingModel(true);
    try {
      await api.updateModel(model!.id, {
        name,
        description: description.trim() ? description : null,
        categoryId: categoryId ? Number(categoryId) : null,
        sourceUrl: trimmedSourceUrl ? trimmedSourceUrl : null,
        sourceSiteName: trimmedSourceUrl ? (detectedSiteName ?? sourceSiteName.trim()) : null,
      });
      refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingModel(false);
    }
  }

  async function deletePrintLog(logId: number) {
    if (!confirm("Delete this print log entry?")) return;
    const updated = await api.deletePrintLog(logId);
    setModel(updated);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Back to library
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          {stlFile ? (
            <Viewer3D
              stlUrl={api.fileDownloadUrl(stlFile.id)}
              modelId={model.id}
              onPreviewSaved={refresh}
              editable={authenticated}
            />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500">
              No STL preview available
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {authenticated ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <input
                  className="w-full rounded bg-slate-800 px-3 py-2 text-xl font-semibold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button onClick={deleteModelAndGoHome} className="shrink-0 text-sm text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>

              <SourcePill sourceUrl={model.sourceUrl} sourceSiteName={model.sourceSiteName} />

              <StarRating
                rating={model.rating}
                onChange={async (rating) => {
                  await api.updateModel(model.id, { rating });
                  refresh();
                }}
              />

              <textarea
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <select
                className="rounded bg-slate-800 px-3 py-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Source URL (optional, unless there are no files) — e.g. the Printables/Thingiverse page"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
              {trimmedSourceUrl && (
                <p className="-mt-2 text-xs text-slate-500">
                  {detectedSiteName
                    ? `Recognized as ${detectedSiteName}.`
                    : "Site not recognized — name it below so visitors know where this came from."}
                </p>
              )}
              {needsManualSiteName && (
                <input
                  className="rounded bg-slate-800 px-3 py-2"
                  placeholder="Site name (e.g. Printables, MakerWorld)"
                  value={sourceSiteName}
                  onChange={(e) => setSourceSiteName(e.target.value)}
                />
              )}

              {saveError && <p className="text-sm text-red-400">{saveError}</p>}

              <button
                onClick={saveModelFields}
                disabled={savingModel}
                className="self-start rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {savingModel ? "Saving…" : "Save"}
              </button>

              <TagEditor
                tags={model.tags}
                onChange={async (names) => {
                  await api.updateModel(model.id, { tags: names });
                  refresh();
                }}
              />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{model.name}</h1>
                <SourcePill sourceUrl={model.sourceUrl} sourceSiteName={model.sourceSiteName} />
              </div>
              <StarRating rating={model.rating} />
              {model.description && <p className="text-slate-300">{model.description}</p>}
              <p className="text-sm text-slate-400">Category: {model.category?.name ?? "Uncategorized"}</p>
              <TagEditor tags={model.tags} onChange={() => {}} readOnly />
            </>
          )}

          {model.sourceUrl && (
            <div>
              <h2 className="mb-1 font-medium text-slate-200">Source</h2>
              <a
                href={model.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-sky-400 hover:text-sky-300"
              >
                {model.sourceUrl}
              </a>
            </div>
          )}

          {model.files.length > 0 && (
            <details open={model.files.length <= 5}>
              <summary className="mb-1 cursor-pointer font-medium text-slate-200">
                Files ({model.files.length})
              </summary>
              <ul className="grid grid-cols-1 gap-1">
                {model.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 text-sm">
                    <span>
                      {file.filename} <span className="text-slate-500">({file.fileType})</span>
                    </span>
                    <a href={api.fileDownloadUrl(file.id)} className="text-sky-400 hover:text-sky-300">
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {authenticated && (
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Print history</h2>
            <PrintLogForm modelId={model.id} onAdded={refresh} />
          </div>

          {model.printLogs.length === 0 ? (
            <p className="text-slate-400">No prints logged yet.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {model.printLogs.map((log) =>
                editingLogId === log.id ? (
                  <li key={log.id}>
                    <EditPrintLogForm
                      modelId={model.id}
                      log={log}
                      onSaved={() => {
                        setEditingLogId(null);
                        refresh();
                      }}
                      onCancel={() => setEditingLogId(null)}
                    />
                  </li>
                ) : (
                  <li key={log.id} className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
                    {log.photoFilename && (
                      <div className="grid grid-cols-1 gap-1">
                        <img
                          src={api.printLogPhotoUrl(log.photoFilename)}
                          alt="Print result"
                          onClick={() => setLightboxSrc(api.printLogPhotoUrl(log.photoFilename!))}
                          className="h-24 w-24 cursor-zoom-in rounded object-cover"
                        />
                        <button
                          onClick={() => api.setPreviewFromLog(model.id, log.id).then(refresh)}
                          className="text-xs text-sky-400 hover:text-sky-300"
                        >
                          Use as preview
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={log.success ? "text-emerald-400" : "text-red-400"}>
                        {log.success ? "Success" : "Failed"} · {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                      {(log.printerName || log.material) && (
                        <p className="text-sm text-slate-400">
                          {[log.printerName, log.material].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {log.notes && <p className="mt-1 text-sm text-slate-300">{log.notes}</p>}
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button onClick={() => setEditingLogId(log.id)} className="text-sky-400 hover:text-sky-300">
                        Edit
                      </button>
                      <button onClick={() => deletePrintLog(log.id)} className="text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
