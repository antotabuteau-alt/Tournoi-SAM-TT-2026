import Link from "next/link";
import { cn } from "@/lib/cn";

export interface Stage {
  label: string;
  status: "done" | "active" | "pending";
  href?: string;
  onClick?: () => void;
}

const NODE_STYLES = {
  done: "border-success-500 bg-success-500 text-white",
  active: "border-brand-500 bg-brand-50 text-brand-600",
  pending: "border-border bg-surface text-navy-400",
};

const LABEL_STYLES = {
  done: "text-navy-700",
  active: "font-semibold text-brand-600",
  pending: "text-navy-400",
};

export function StageTracker({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-wrap items-center gap-y-2">
      {stages.map((stage, i) => {
        const content = (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                NODE_STYLES[stage.status]
              )}
            >
              {stage.status === "done" ? "✓" : i + 1}
            </span>
            <span className={cn("whitespace-nowrap text-sm", LABEL_STYLES[stage.status])}>
              {stage.label}
            </span>
          </div>
        );

        return (
          <div key={stage.label} className="flex items-center">
            {stage.href ? (
              <Link href={stage.href} className="rounded-md transition-opacity hover:opacity-70">
                {content}
              </Link>
            ) : stage.onClick ? (
              <button
                type="button"
                onClick={stage.onClick}
                className="rounded-md transition-opacity hover:opacity-70"
              >
                {content}
              </button>
            ) : (
              content
            )}
            {i < stages.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-0.5 w-6 shrink-0 sm:w-10",
                  stage.status === "done" ? "bg-success-500" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
