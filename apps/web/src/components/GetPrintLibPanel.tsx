import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function GetPrintLibPanel() {
  // Hidden until the server confirms it's enabled, so it never flashes when turned off.
  const [show, setShow] = useState(false);
  useEffect(() => {
    api
      .getConfig()
      .then((c) => setShow(c.showGetPrintLibPanel))
      .catch(() => {});
  }, []);
  if (!show) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-1 font-medium text-slate-200">Want your own PrintLib?</h2>
      <p className="mb-2 text-sm text-slate-400">It's free and open source — run your own model library.</p>
      <a
        href="https://github.com/Jonesie/printlib"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-sky-400 hover:text-sky-300"
      >
        Get it on GitHub →
      </a>
    </div>
  );
}
