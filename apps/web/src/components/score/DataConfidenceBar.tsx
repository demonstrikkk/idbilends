export function DataConfidenceBar({ value }: { value: number | null | undefined }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>Data confidence</span>
        <span className="font-medium text-slate-200">{value == null ? "Not available" : `${value}%`}</span>
      </div>
      <div className="h-2 bg-[#233647]">
        <div className="h-2 bg-cyan" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
