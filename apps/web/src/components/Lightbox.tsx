import { useEffect } from "react";

export default function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-2xl text-white/80 hover:text-white"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
