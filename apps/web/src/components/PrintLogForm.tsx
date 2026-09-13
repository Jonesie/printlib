import { useState } from "react";
import type { PrintLog } from "@printlib/shared";
import { api } from "../api/client";
import FilePickerButton from "./FilePickerButton";

// Local calendar date, not toISOString()'s UTC date — otherwise this shows
// the wrong day whenever local time and UTC fall on different calendar
// dates (i.e. most of the time outside UTC+0).
function toLocalDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function today(): string {
  return toLocalDateInput(new Date());
}

// Combines the chosen calendar date (in the browser's own timezone) with
// the current time-of-day into a full instant, computed client-side so the
// server never has to guess which timezone the date string was meant in.
function dateInputToIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const now = new Date();
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()).toISOString();
}

function PrintLogFields({
  modelId,
  log,
  onDone,
  onCancel,
}: {
  modelId: number;
  log?: PrintLog;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [success, setSuccess] = useState(log?.success ?? true);
  const [date, setDate] = useState(log ? toLocalDateInput(new Date(log.createdAt)) : today());
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [printerName, setPrinterName] = useState(log?.printerName ?? "");
  const [material, setMaterial] = useState(log?.material ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("success", String(success));
      form.set("date", dateInputToIso(date));
      if (notes.trim()) form.set("notes", notes.trim());
      if (printerName.trim()) form.set("printerName", printerName.trim());
      if (material.trim()) form.set("material", material.trim());
      if (photo) form.set("photo", photo);

      if (log) {
        await api.updatePrintLog(log.id, form);
      } else {
        await api.addPrintLog(modelId, form);
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={success} onChange={() => setSuccess(true)} /> Success
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={!success} onChange={() => setSuccess(false)} /> Failed
          </label>
        </div>
        <input
          type="date"
          className="rounded bg-slate-800 px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
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
        <FilePickerButton file={photo} onChange={setPhoto} />
        {log?.photoFilename && !photo && (
          <p className="text-xs text-slate-500">Leave blank to keep the existing photo.</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PrintLogForm({ modelId, onAdded }: { modelId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);

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
    <PrintLogFields
      modelId={modelId}
      onDone={() => {
        setOpen(false);
        onAdded();
      }}
      onCancel={() => setOpen(false)}
    />
  );
}

export function EditPrintLogForm({
  modelId,
  log,
  onSaved,
  onCancel,
}: {
  modelId: number;
  log: PrintLog;
  onSaved: () => void;
  onCancel: () => void;
}) {
  return <PrintLogFields modelId={modelId} log={log} onDone={onSaved} onCancel={onCancel} />;
}
