import { useState } from "react";
import { api, type ShareSite } from "../api/client";
import Modal from "./Modal";

interface SiteInfo {
  label: string;
  maxChars: number;
  needsPhoto: boolean;
  color: string;
  icon: JSX.Element;
}

const SITES: Record<ShareSite, SiteInfo> = {
  bluesky: {
    label: "Bluesky",
    maxChars: 300,
    needsPhoto: false,
    color: "text-sky-400 hover:text-sky-300",
    icon: (
      <path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026" />
    ),
  },
  facebook: {
    label: "Facebook",
    maxChars: 5000,
    needsPhoto: false,
    color: "text-blue-500 hover:text-blue-400",
    icon: (
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    ),
  },
  instagram: {
    label: "Instagram",
    maxChars: 2200,
    needsPhoto: true,
    color: "text-pink-400 hover:text-pink-300",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" />
      </>
    ),
  },
};

function SiteIcon({ site, className }: { site: ShareSite; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {SITES[site].icon}
    </svg>
  );
}

function ShareButton({
  site,
  logId,
  configured,
  hasPhoto,
}: {
  site: ShareSite;
  logId: number;
  configured: boolean;
  hasPhoto: boolean;
}) {
  const info = SITES[site];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [imageSkipped, setImageSkipped] = useState(false);

  const disabledReason = !configured
    ? `${info.label} is not configured`
    : info.needsPhoto && !hasPhoto
      ? `${info.label} posts need a photo`
      : null;

  async function openModal() {
    setOpen(true);
    setError(null);
    setPostUrl(null);
    setText("");
    try {
      setText((await api.getShareDraft(logId, site)).text);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function post() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.shareTo(site, logId, text);
      setPostUrl(res.url);
      setImageSkipped(res.imageSkipped);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const count = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;

  return (
    <>
      <button
        onClick={openModal}
        disabled={disabledReason !== null}
        title={disabledReason ?? `Share to ${info.label}`}
        aria-label={`Share to ${info.label}`}
        className={`inline-flex items-center rounded p-1 enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600 ${
          disabledReason ? "" : info.color
        }`}
      >
        <SiteIcon site={site} className="h-4 w-4" />
      </button>
      {open && (
        <Modal title={`Share to ${info.label}`} onClose={() => setOpen(false)}>
          {postUrl ? (
            <div className="grid grid-cols-1 gap-3">
              <p className="text-emerald-400">Posted!</p>
              {imageSkipped && <p className="text-sm text-slate-400">The photo was left out.</p>}
              <a href={postUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300">
                View on {info.label}
              </a>
              <button onClick={() => setOpen(false)} className="rounded bg-slate-800 px-3 py-1.5">
                Close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2"
              />
              <p className={`text-right text-xs ${count > info.maxChars ? "text-red-400" : "text-slate-400"}`}>
                {count}/{info.maxChars}
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="rounded bg-slate-800 px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={post}
                  disabled={busy || !text.trim() || count > info.maxChars}
                  className="rounded bg-sky-600 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  {busy ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export default function ShareButtons({
  logId,
  hasPhoto,
  integrations,
}: {
  logId: number;
  hasPhoto: boolean;
  integrations: Record<ShareSite, boolean>;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-slate-400">Share</span>
      {(Object.keys(SITES) as ShareSite[]).map((site) => (
        <ShareButton key={site} site={site} logId={logId} configured={integrations[site]} hasPhoto={hasPhoto} />
      ))}
    </div>
  );
}
