import { useState } from "react";
import { api } from "../api/client";
import Modal from "./Modal";

const MAX_POST_CHARS = 300;

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
      <button onClick={openModal} className="text-sky-400 hover:text-sky-300">
        Share
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
