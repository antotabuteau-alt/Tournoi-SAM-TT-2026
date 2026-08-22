import { cn } from "@/lib/cn";

const ACCENTS = {
  brand: "bg-brand-50 text-brand-600",
  accent: "bg-accent-50 text-accent-500",
  success: "bg-success-50 text-success-600",
  navy: "bg-navy-900/5 text-navy-700",
} as const;

export function StatTile({
  label,
  value,
  icon,
  accent = "navy",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm shadow-navy-950/[.02]">
      {icon && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base",
            ACCENTS[accent]
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
          {label}
        </div>
        <div className="mt-0.5 text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
