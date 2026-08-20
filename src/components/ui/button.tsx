import { cn } from "@/lib/cn";

export const BUTTON_VARIANTS = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20 font-medium",
  accent: "bg-brand-500 text-white hover:bg-brand-600 font-extrabold shadow-sm shadow-brand-500/30",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-muted font-medium",
  ghost: "text-navy-400 hover:bg-navy-900/5 hover:text-foreground font-medium",
  danger: "border border-danger-50 bg-white text-danger-600 hover:bg-danger-50 font-medium",
  dark: "bg-navy-900 text-white hover:bg-navy-800 font-medium",
} as const;

export const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
} as const;

export function buttonClasses(
  variant: keyof typeof BUTTON_VARIANTS = "primary",
  size: keyof typeof BUTTON_SIZES = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
