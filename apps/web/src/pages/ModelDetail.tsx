import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ModelDetail as ModelDetailType } from "@printlib/shared";
import { api } from "../api/client";
import Viewer3D from "../components/Viewer3D";
import TagEditor from "../components/TagEditor";
import PrintLogForm from "../components/PrintLogForm";

export default function ModelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<ModelDetailType | null>(null);

  async function refresh() {
    setModel(await api.getModel(Number(id)));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!model) return <p className="text-slate-400">Loading…</p>;

  const stlFile = model.files.find((f) => f.fileType === "stl");

  async function deleteModelAndGoHome() {
    if (!confirm(`Delete "${model!.name}"? This removes its files too.`)) return;
    await api.deleteModel(model!.id);
    navigate("/");
  }

  return (
    <div className="grid gap-6">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Back to library
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {stlFile ? (
            <Viewer3D stlUrl={api.fileDownloadUrl(stlFile.id)} />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500">
              No STL preview available
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-semibold">{model.name}</h1>
            <button onClick={deleteModelAndGoHome} className="text-sm text-red-400 hover:text-red-300">
              Delete
            </button>
          </div>
          {model.description && <p className="text-slate-300">{model.description}</p>}
          <p className="text-sm text-slate-400">Category: {model.category?.name ?? "Uncategorized"}</p>

          <TagEditor
            tags={model.tags}
            onChange={async (names) => {
              await api.updateModel(model.id, { tags: names });
              refresh();
            }}
          />

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
          <PrintLogForm modelId={model.id} onAdded={refresh} />
        </div>

        {model.printLogs.length === 0 ? (
          <p className="text-slate-400">No prints logged yet.</p>
        ) : (
          <ul className="grid gap-3">
            {model.printLogs.map((log) => (
              <li key={log.id} className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
                {log.photoFilename && (
                  <img
                    src={api.printLogPhotoUrl(log.photoFilename)}
                    alt="Print result"
                    className="h-24 w-24 rounded object-cover"
                  />
                )}
                <div>
                  <p className={log.success ? "text-emerald-400" : "text-red-400"}>
                    {log.success ? "Success" : "Failed"} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                  {(log.printerName || log.material) && (
                    <p className="text-sm text-slate-400">
                      {[log.printerName, log.material].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {log.notes && <p className="mt-1 text-sm text-slate-300">{log.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
