import { useState } from "react";
import { api } from "../api/client";
import Modal from "./Modal";

const MAX_POST_CHARS = 300;

function BlueskyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026" />
    </svg>
  );
}

export default function BlueskyShareButton({ logId }: { logId: number }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [imageSkipped, setImageSkipped] = useState(false);

  async function openModal() {
    setOpen(true);
    setError(null);
    setPostUrl(null);
    setText("");
    try {
      setText((await api.getShareDraft(logId)).text);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function post() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.shareToBluesky(logId, text);
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
        title="Share to Bluesky"
        aria-label="Share to Bluesky"
        className="inline-flex items-center rounded p-1 text-sky-400 hover:bg-slate-800 hover:text-sky-300"
      >
        <BlueskyLogo className="h-4 w-4" />
      </button>
      {open && (
        <Modal title="Share to Bluesky" onClose={() => setOpen(false)}>
          {postUrl ? (
            <div className="grid grid-cols-1 gap-3">
              <p className="text-emerald-400">Posted!</p>
              {imageSkipped && (
                <p className="text-sm text-slate-400">The photo was left out (Bluesky limits images to about 1 MB).</p>
              )}
              <a href={postUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300">
                View on Bluesky
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
              <p className={`text-right text-xs ${count > MAX_POST_CHARS ? "text-red-400" : "text-slate-400"}`}>
                {count}/{MAX_POST_CHARS}
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="rounded bg-slate-800 px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={post}
                  disabled={busy || !text.trim() || count > MAX_POST_CHARS}
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
