export default function GetPrintLibPanel() {
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
