import { cn } from "@/lib/cn";

const VARIANTS = {
  neutral: "bg-navy-900/5 text-navy-700",
  brand: "bg-brand-50 text-brand-600",
  accent: "bg-accent-50 text-accent-500",
  success: "bg-success-50 text-success-600",
  danger: "bg-danger-50 text-danger-600",
} as const;

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
