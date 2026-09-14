export default function SourcePill({
  sourceUrl,
  sourceSiteName,
}: {
  sourceUrl: string | null;
  sourceSiteName: string | null;
}) {
  if (sourceUrl) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-900/90 px-2 py-0.5 text-xs font-medium text-amber-200">
        🔗 {sourceSiteName ?? "External source"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-900/90 px-2 py-0.5 text-xs font-medium text-emerald-200">
      ⬇ Download
    </span>
  );
}
