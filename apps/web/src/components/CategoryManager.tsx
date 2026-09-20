import { useState } from "react";
import type { Category } from "@printlib/shared";
import { api } from "../api/client";
import Modal from "./Modal";

function CategoryRow({ category, onChanged }: { category: Category; onChanged: () => void }) {
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);

  async function rename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setName(category.name);
      return;
    }
    try {
      await api.updateCategory(category.id, trimmed);
      setError(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename");
      setName(category.name);
    }
  }

  async function remove() {
    if (!confirm(`Delete category "${category.name}"? Models keep their files, just become uncategorized.`)) return;
    await api.deleteCategory(category.id);
    onChanged();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="min-w-0 flex-1 rounded bg-slate-800 px-3 py-1.5 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={rename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <button onClick={remove} className="text-sm text-red-400 hover:text-red-300">
        Delete
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export default function CategoryManager({
  categories,
  onChanged,
}: {
  categories: Category[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  async function addCategory() {
    if (!newName.trim()) return;
    await api.createCategory(newName.trim());
    setNewName("");
    onChanged();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm text-slate-400 hover:text-slate-200">
        Manage categories
      </button>

      {open && (
        <Modal title="Categories" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-1 gap-2">
            {categories.map((c) => (
              <CategoryRow key={c.id} category={c} onChanged={onChanged} />
            ))}
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded bg-slate-800 px-3 py-1.5 text-sm"
                placeholder="New category"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCategory();
                }}
              />
              <button
                onClick={addCategory}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
