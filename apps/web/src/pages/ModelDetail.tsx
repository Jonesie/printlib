import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Category, ModelDetail as ModelDetailType } from "@printlib/shared";
import { api } from "../api/client";
import Viewer3D from "../components/Viewer3D";
import TagEditor from "../components/TagEditor";
import PrintLogForm, { EditPrintLogForm } from "../components/PrintLogForm";
import { useAuth } from "../auth/AuthContext";

export default function ModelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const [model, setModel] = useState<ModelDetailType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [savingModel, setSavingModel] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  async function refresh() {
    const m = await api.getModel(Number(id));
    setModel(m);
    setName(m.name);
    setDescription(m.description ?? "");
    setCategoryId(m.category ? String(m.category.id) : "");
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

  async function saveModelFields() {
    setSavingModel(true);
    try {
      await api.updateModel(model!.id, {
        name,
        description: description.trim() ? description : null,
        categoryId: categoryId ? Number(categoryId) : null,
      });
      refresh();
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
    <div className="grid gap-6">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Back to library
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
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

        <div className="grid gap-3">
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
              <h1 className="text-xl font-semibold">{model.name}</h1>
              {model.description && <p className="text-slate-300">{model.description}</p>}
              <p className="text-sm text-slate-400">Category: {model.category?.name ?? "Uncategorized"}</p>
              <TagEditor tags={model.tags} onChange={() => {}} readOnly />
            </>
          )}

          <div>
            <h2 className="mb-1 font-medium text-slate-200">Files</h2>
            <ul className="grid gap-1">
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
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Print history</h2>
          {authenticated && <PrintLogForm modelId={model.id} onAdded={refresh} />}
        </div>

        {model.printLogs.length === 0 ? (
          <p className="text-slate-400">No prints logged yet.</p>
        ) : (
          <ul className="grid gap-3">
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
                    <img
                      src={api.printLogPhotoUrl(log.photoFilename)}
                      alt="Print result"
                      className="h-24 w-24 rounded object-cover"
                    />
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
                  {authenticated && (
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button onClick={() => setEditingLogId(log.id)} className="text-sky-400 hover:text-sky-300">
                        Edit
                      </button>
                      <button onClick={() => deletePrintLog(log.id)} className="text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
