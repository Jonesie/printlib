// A styled label wrapping a visually-hidden file input. Native file inputs
// have a browser-enforced minimum render width that ignores CSS width —
// harmless in a wide form, but it overflows narrow sidebar columns. A
// label is a normal element that respects width like anything else.
export default function FilePickerButton({
  file,
  onChange,
  placeholder = "Choose photo…",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  placeholder?: string;
}) {
  return (
    <label className="block w-full cursor-pointer truncate rounded bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
      {file ? file.name : placeholder}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
