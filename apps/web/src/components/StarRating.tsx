export default function StarRating({
  rating,
  onChange,
  size = "text-base",
}: {
  rating: number | null;
  onChange?: (rating: number | null) => void;
  size?: string;
}) {
  const editable = !!onChange;

  if (!editable && !rating) return null;

  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!editable}
          onClick={() => onChange?.(rating === n ? null : n)}
          className={editable ? "cursor-pointer" : "cursor-default"}
          title={editable ? `Rate ${n} star${n === 1 ? "" : "s"}` : undefined}
        >
          <span className={rating && n <= rating ? "text-amber-400" : "text-slate-600"}>★</span>
        </button>
      ))}
    </div>
  );
}
