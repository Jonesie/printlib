import { useRef, useState } from "react";
import type { Category } from "@printlib/shared";
import { api } from "../api/client";

export default function UploadDropzone({
  categories,
  onUploaded,
}: {
  categories: Category[];
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function submit() {
    if (!name.trim() || files.length === 0) {
      setError("A name and at least one file are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let finalCategoryId = categoryId ? Number(categoryId) : undefined;
      if (newCategory.trim()) {
        const created = await api.createCategory(newCategory.trim());
        finalCategoryId = created.id;
      }
      const form = new FormData();
      form.set("name", name.trim());
      if (description.trim()) form.set("description", description.trim());
      if (finalCategoryId) form.set("categoryId", String(finalCategoryId));
      if (tags.trim()) form.set("tags", tags.trim());
      for (const file of files) form.append("file", file);

      await api.createModel(form);
      setOpen(false);
      setName("");
      setDescription("");
      setCategoryId("");
      setNewCategory("");
      setTags("");
      setFiles([]);
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
      >
        + Add model
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Add a model</h2>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>

      <div className="grid gap-3">
        <input
          className="rounded bg-slate-800 px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="rounded bg-slate-800 px-3 py-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
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
            placeholder="Or create new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </div>
        <input
          className="rounded bg-slate-800 px-3 py-2"
          placeholder="Tags, comma separated"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded border-2 border-dashed p-6 text-center ${
            dragOver ? "border-sky-400 bg-slate-800" : "border-slate-700"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <p className="text-slate-400">
            Drop a .zip or model files here, or click to browse
          </p>
          {files.length > 0 && (
            <ul className="mt-2 text-left text-sm text-slate-300">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}
