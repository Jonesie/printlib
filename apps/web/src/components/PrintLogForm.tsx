import { useState } from "react";
import { api } from "../api/client";

export default function PrintLogForm({ modelId, onAdded }: { modelId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(true);
  const [notes, setNotes] = useState("");
  const [printerName, setPrinterName] = useState("");
  const [material, setMaterial] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("success", String(success));
      if (notes.trim()) form.set("notes", notes.trim());
      if (printerName.trim()) form.set("printerName", printerName.trim());
      if (material.trim()) form.set("material", material.trim());
      if (photo) form.set("photo", photo);

      await api.addPrintLog(modelId, form);
      setOpen(false);
      setNotes("");
      setPrinterName("");
      setMaterial("");
      setPhoto(null);
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
      >
        + Log a print
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="grid gap-3">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={success} onChange={() => setSuccess(true)} /> Success
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={!success} onChange={() => setSuccess(false)} /> Failed
          </label>
        </div>
        <textarea
          className="rounded bg-slate-800 px-3 py-2"
          placeholder="Notes (settings, what happened, adjustments...)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded bg-slate-800 px-3 py-2"
            placeholder="Printer (optional)"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
          />
          <input
            className="rounded bg-slate-800 px-3 py-2"
            placeholder="Material (optional)"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </div>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
