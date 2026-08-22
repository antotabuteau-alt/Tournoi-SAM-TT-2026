import { cn } from "@/lib/cn";

const AVATAR_COLORS = [
  "bg-brand-500", "bg-accent-500", "bg-success-500", "bg-danger-600",
  "bg-navy-700", "bg-purple-500", "bg-pink-500", "bg-teal-500",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-sm",
    xl: "h-20 w-20 text-lg",
  };
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        avatarColor(name),
        sizeClasses[size]
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
