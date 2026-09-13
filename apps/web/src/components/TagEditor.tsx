import { useState } from "react";
import type { Tag } from "@printlib/shared";

export default function TagEditor({
  tags,
  onChange,
  readOnly,
}: {
  tags: Tag[];
  onChange: (names: string[]) => void;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const name = draft.trim();
    if (!name || tags.some((t) => t.name === name)) {
      setDraft("");
      return;
    }
    onChange([...tags.map((t) => t.name), name]);
    setDraft("");
  }

  function remove(name: string) {
    onChange(tags.filter((t) => t.name !== name).map((t) => t.name));
  }

  if (readOnly) {
    if (tags.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span key={tag.id} className="rounded-full bg-slate-800 px-3 py-1 text-sm">
            {tag.name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span key={tag.id} className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-sm">
          {tag.name}
          <button onClick={() => remove(tag.name)} className="text-slate-500 hover:text-slate-300">
            ×
          </button>
        </span>
      ))}
      <input
        className="rounded-full bg-slate-800 px-3 py-1 text-sm"
        placeholder="+ tag"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}
