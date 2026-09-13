import { useEffect, useState } from "react";
import type { Printer } from "@printlib/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PrinterForm from "./PrinterForm";
import Lightbox from "./Lightbox";

export default function PrintersPanel() {
  const { authenticated } = useAuth();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function refresh() {
    api.listPrinters().then(setPrinters);
  }

  useEffect(refresh, []);

  async function remove(printer: Printer) {
    if (!confirm(`Remove "${printer.name}"?`)) return;
    await api.deletePrinter(printer.id);
    refresh();
  }

  if (printers.length === 0 && !authenticated) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium text-slate-200">Printers</h2>
        {authenticated && !adding && (
          <button onClick={() => setAdding(true)} className="text-sm text-sky-400 hover:text-sky-300">
            + Add printer
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3">
          <PrinterForm
            onDone={() => {
              setAdding(false);
              refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {printers.length === 0 ? (
        <p className="text-sm text-slate-400">No printers recorded yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {printers.map((printer) =>
            editingId === printer.id ? (
              <PrinterForm
                key={printer.id}
                printer={printer}
                onDone={() => {
                  setEditingId(null);
                  refresh();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={printer.id} className="flex gap-3 rounded-lg bg-slate-800 p-3">
                {printer.photoFilename && (
                  <img
                    src={api.printerPhotoUrl(printer.photoFilename)}
                    alt={printer.name}
                    onClick={() => setLightboxSrc(api.printerPhotoUrl(printer.photoFilename!))}
                    className="h-20 w-20 shrink-0 cursor-zoom-in rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{printer.name}</h3>
                  {printer.model && <p className="truncate text-sm text-slate-400">{printer.model}</p>}
                  {(printer.purchasedAt || printer.price != null) && (
                    <p className="text-xs text-slate-500">
                      {[
                        printer.purchasedAt && new Date(printer.purchasedAt).toLocaleDateString(),
                        printer.price != null && `$${printer.price.toFixed(2)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {printer.notes && <p className="mt-1 text-sm text-slate-300">{printer.notes}</p>}
                  {authenticated && (
                    <div className="mt-2 flex gap-3 text-sm">
                      <button onClick={() => setEditingId(printer.id)} className="text-sky-400 hover:text-sky-300">
                        Edit
                      </button>
                      <button onClick={() => remove(printer)} className="text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
