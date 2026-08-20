export function StatTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
