import { BrandLogo } from "@/components/brand-logo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 py-16"
      style={{ backgroundImage: "var(--gradient-navy-auth)" }}
    >
      <div className="mb-8 flex items-center gap-2 text-white">
        <BrandLogo size="sm" />
        <span className="text-lg font-bold">Tournoi du SAM TT 2026</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-xl">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <div className="mt-6 text-sm text-navy-300">{footer}</div>}
    </div>
  );
}
