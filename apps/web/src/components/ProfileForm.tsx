import { useState } from "react";
import type { Profile, SocialLink } from "@printlib/shared";
import { api } from "../api/client";

export default function ProfileForm({
  profile,
  onDone,
  onCancel,
}: {
  profile: Profile | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [note, setNote] = useState(profile?.note ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(profile?.socialLinks ?? []);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setSocialLinks((links) => [...links, { label: newLabel.trim(), url: newUrl.trim() }]);
    setNewLabel("");
    setNewUrl("");
  }

  function removeLink(index: number) {
    setSocialLinks((links) => links.filter((_, i) => i !== index));
  }

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
      if (location.trim()) form.set("location", location.trim());
      if (note.trim()) form.set("note", note.trim());
      if (email.trim()) form.set("email", email.trim());
      if (phone.trim()) form.set("phone", phone.trim());
      form.set("socialLinks", JSON.stringify(socialLinks));
      if (avatar) form.set("avatar", avatar);

      await api.saveProfile(form);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input
        className="rounded bg-slate-800 px-3 py-2 text-sm"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
      {profile?.avatarFilename && !avatar && (
        <p className="text-xs text-slate-500">Leave blank to keep the existing avatar.</p>
      )}
      <input
        className="rounded bg-slate-800 px-3 py-2 text-sm"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <textarea
        className="rounded bg-slate-800 px-3 py-2 text-sm"
        placeholder="Note / bio"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <input
        className="rounded bg-slate-800 px-3 py-2 text-sm"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="rounded bg-slate-800 px-3 py-2 text-sm"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <div className="grid gap-2">
        <p className="text-xs text-slate-500">Social links</p>
        {socialLinks.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm text-slate-300">
              {link.label} — {link.url}
            </span>
            <button onClick={() => removeLink(i)} className="text-sm text-red-400 hover:text-red-300">
              Remove
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            className="w-24 rounded bg-slate-800 px-2 py-1 text-sm"
            placeholder="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <input
            className="flex-1 rounded bg-slate-800 px-2 py-1 text-sm"
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
