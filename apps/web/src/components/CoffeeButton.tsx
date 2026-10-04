export default function CoffeeButton() {
  return (
    <a
      href="https://www.buymeacoffee.com/jonesie"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 font-medium text-slate-900 hover:bg-amber-300"
    >
      <span aria-hidden="true">☕</span>
      Buy me a coffee
    </a>
  );
}
