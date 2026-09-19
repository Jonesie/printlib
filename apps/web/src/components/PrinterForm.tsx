import { useState } from "react";
import type { Printer } from "@printlib/shared";
import { api } from "../api/client";
import FilePickerButton from "./FilePickerButton";

export default function PrinterForm({
  printer,
  onDone,
  onCancel,
}: {
  printer?: Printer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(printer?.name ?? "");
  const [model, setModel] = useState(printer?.model ?? "");
  const [purchasedAt, setPurchasedAt] = useState(printer?.purchasedAt ?? "");
  const [price, setPrice] = useState(printer?.price != null ? String(printer.price) : "");
  const [notes, setNotes] = useState(printer?.notes ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("A name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      if (model.trim()) form.set("model", model.trim());
      if (purchasedAt) form.set("purchasedAt", purchasedAt);
      if (price.trim()) form.set("price", price.trim());
      if (notes.trim()) form.set("notes", notes.trim());
      if (photo) form.set("photo", photo);

      if (printer) {
        await api.updatePrinter(printer.id, form);
      } else {
        await api.createPrinter(form);
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save printer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <input
        className="rounded bg-slate-800 px-3 py-2"
        placeholder="Name (e.g. Workhorse)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="rounded bg-slate-800 px-3 py-2"
        placeholder="Model (e.g. Bambu Lab X1 Carbon)"
        value={model}
        onChange={(e) => setModel(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          className="rounded bg-slate-800 px-3 py-2"
          value={purchasedAt}
          onChange={(e) => setPurchasedAt(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          className="rounded bg-slate-800 px-3 py-2"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <textarea
        className="rounded bg-slate-800 px-3 py-2"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <FilePickerButton file={photo} onChange={setPhoto} />
      {printer?.photoFilename && !photo && (
        <p className="text-xs text-slate-500">Leave blank to keep the existing photo.</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>
    </div>
  );
}
