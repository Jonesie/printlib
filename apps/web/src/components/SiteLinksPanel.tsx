import { useEffect, useState } from "react";
import type { SiteLink } from "@printlib/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

function SiteFavicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  let hostname: string | null = null;
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = null;
  }

  if (!hostname || failed) {
    return <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs">🔗</span>;
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`}
      alt=""
      className="h-4 w-4 shrink-0 rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}

function EditableRow({ link, onChanged }: { link: SiteLink; onChanged: () => void }) {
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);

  async function save() {
    if (name.trim() === link.name && url.trim() === link.url) return;
    await api.updateSiteLink(link.id, { name: name.trim(), url: url.trim() });
    onChanged();
  }

  async function remove() {
    if (!confirm(`Remove "${link.name}"?`)) return;
    await api.deleteSiteLink(link.id);
    onChanged();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="w-32 rounded bg-slate-800 px-2 py-1 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
      />
      <input
        className="min-w-0 flex-1 rounded bg-slate-800 px-2 py-1 text-sm"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={save}
      />
      <button onClick={remove} className="text-sm text-red-400 hover:text-red-300">
        Remove
      </button>
    </div>
  );
}

export default function SiteLinksPanel() {
  const { authenticated } = useAuth();
  const [links, setLinks] = useState<SiteLink[]>([]);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function refresh() {
    api.listSiteLinks().then(setLinks);
  }

  useEffect(refresh, []);

  async function addLink() {
    if (!newName.trim() || !newUrl.trim()) return;
    await api.createSiteLink(newName.trim(), newUrl.trim());
    setNewName("");
    setNewUrl("");
    refresh();
  }

  if (links.length === 0 && !authenticated) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium text-slate-200">Find models on</h2>
        {authenticated && (
          <button onClick={() => setEditing((v) => !v)} className="text-sm text-slate-400 hover:text-slate-200">
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {editing && authenticated ? (
        <div className="grid grid-cols-1 gap-2">
          {links.map((link) => (
            <EditableRow key={link.id} link={link} onChanged={refresh} />
          ))}
          <div className="mt-1 flex items-center gap-2">
            <input
              className="w-32 rounded bg-slate-800 px-2 py-1 text-sm"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="min-w-0 flex-1 rounded bg-slate-800 px-2 py-1 text-sm"
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
            />
            <button onClick={addLink} className="rounded-md border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800">
              Add
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded px-2 py-1 text-sm text-sky-400 hover:bg-slate-800 hover:text-sky-300"
            >
              <SiteFavicon url={link.url} />
              <span className="truncate">{link.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
