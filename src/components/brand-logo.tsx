const SIZES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-14 w-14",
} as const;

export function BrandLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/sam-logo.png"
      alt="Logo SAM"
      className={`${SIZES[size]} shrink-0 object-contain ${className ?? ""}`}
    />
  );
}
