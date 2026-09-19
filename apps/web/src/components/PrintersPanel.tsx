import { useEffect, useState } from "react";
import type { Printer } from "@printlib/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PrinterForm from "./PrinterForm";
import Lightbox from "./Lightbox";
import Modal from "./Modal";

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

  const editingPrinter = editingId != null ? printers.find((p) => p.id === editingId) : undefined;

  const content = (
    <>
      {authenticated && (
        <button onClick={() => setAdding(true)} className="mb-3 text-sm text-sky-400 hover:text-sky-300">
          + Add printer
        </button>
      )}

      {printers.length === 0 ? (
        <p className="text-sm text-slate-400">No printers recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {printers.map((printer) => (
            <div key={printer.id} className="rounded-lg bg-slate-800 p-3">
              {printer.photoFilename && (
                <img
                  src={api.printerPhotoUrl(printer.photoFilename)}
                  alt={printer.name}
                  onClick={() => setLightboxSrc(api.printerPhotoUrl(printer.photoFilename!))}
                  className="mb-2 aspect-square w-full cursor-zoom-in rounded object-cover"
                />
              )}
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
          ))}
        </div>
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );

  return (
    <>
      {/* Mobile: a collapsible section ahead of search/results, collapsed by default. */}
      <details className="order-2 rounded-lg border border-slate-800 bg-slate-900 p-4 lg:hidden">
        <summary className="cursor-pointer font-medium text-slate-200">Printers</summary>
        <div className="mt-3">{content}</div>
      </details>

      {/* Desktop: an always-visible sidebar column. */}
      <aside className="order-3 hidden min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-4 lg:sticky lg:top-6 lg:block lg:self-start">
        <h2 className="mb-3 font-medium text-slate-200">Printers</h2>
        {content}
      </aside>

      {adding && (
        <Modal title="Add a printer" onClose={() => setAdding(false)}>
          <PrinterForm
            onDone={() => {
              setAdding(false);
              refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}

      {editingPrinter && (
        <Modal title="Edit printer" onClose={() => setEditingId(null)}>
          <PrinterForm
            printer={editingPrinter}
            onDone={() => {
              setEditingId(null);
              refresh();
            }}
            onCancel={() => setEditingId(null)}
          />
        </Modal>
      )}
    </>
  );
}
