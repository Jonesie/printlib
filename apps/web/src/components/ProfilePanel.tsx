import { useEffect, useState } from "react";
import type { Profile } from "@printlib/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import ProfileForm from "./ProfileForm";
import Lightbox from "./Lightbox";
import Modal from "./Modal";

export default function ProfilePanel() {
  const { authenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function refresh() {
    api.getProfile().then((p) => {
      setProfile(p);
      setLoaded(true);
    });
  }

  useEffect(refresh, []);

  if (!loaded) return null;
  if (!profile && !authenticated) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      {profile ? (
        <div className="grid grid-cols-1 gap-2">
          {profile.avatarFilename && (
            <img
              src={api.avatarUrl(profile.avatarFilename)}
              alt={profile.name}
              onClick={() => setLightboxSrc(api.avatarUrl(profile.avatarFilename!))}
              className="h-20 w-20 cursor-zoom-in rounded-full object-cover"
            />
          )}
          <h2 className="text-lg font-semibold">{profile.name}</h2>
          {profile.location && <p className="text-sm text-slate-400">{profile.location}</p>}
          {profile.note && <p className="text-sm text-slate-300">{profile.note}</p>}

          {(profile.email || profile.phone) && (
            <div className="grid grid-cols-1 gap-0.5 text-sm">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="text-sky-400 hover:text-sky-300">
                  {profile.email}
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="text-sky-400 hover:text-sky-300">
                  {profile.phone}
                </a>
              )}
            </div>
          )}

          {profile.socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs text-sky-400 hover:bg-slate-700"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {authenticated && (
            <button
              onClick={() => setEditing(true)}
              className="mt-1 self-start text-sm text-slate-400 hover:text-slate-200"
            >
              Edit profile
            </button>
          )}
        </div>
      ) : (
        authenticated && (
          <button onClick={() => setEditing(true)} className="text-sm text-sky-400 hover:text-sky-300">
            + Add profile
          </button>
        )
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {editing && (
        <Modal title={profile ? "Edit profile" : "Add profile"} onClose={() => setEditing(false)}>
          <ProfileForm
            profile={profile}
            onDone={() => {
              setEditing(false);
              refresh();
            }}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </div>
  );
}
