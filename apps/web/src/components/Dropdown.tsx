import { useEffect, useRef, useState } from "react";

// A from-scratch dropdown, not a native <select>. Some Chrome installs
// render the native popup for a <select> sitting right at the top edge of
// the page with no visible space for its options (confirmed: the options
// are there — arrow keys cycle through them — only the popup's own
// rendering is broken). Fully CSS-controlled markup sidesteps that
// entirely.
export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { id: T; name: string }[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-slate-800 px-2 py-1 text-sm text-slate-300 hover:bg-slate-700"
      >
        {current?.name ?? value} <span className="text-slate-500">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-md border border-slate-700 bg-slate-800 shadow-lg">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={`block w-full whitespace-nowrap px-3 py-1.5 text-left text-sm hover:bg-slate-700 ${
                o.id === value ? "text-sky-400" : "text-slate-300"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
