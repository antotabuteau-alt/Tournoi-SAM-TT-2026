"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrganizationLogoAction,
  removeOrganizationLogoAction,
} from "@/actions/organizations.actions";
import { Button } from "@/components/ui/button";

export function LogoForm({
  orgSlug,
  currentLogoUrl,
}: {
  orgSlug: string;
  currentLogoUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    setError(null);
    const formData = new FormData();
    formData.set("logo", file);
    startTransition(async () => {
      const res = await updateOrganizationLogoAction(orgSlug, formData);
      if ("error" in res) {
        setError(res.error);
        setPreview(currentLogoUrl);
        return;
      }
      router.refresh();
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const res = await removeOrganizationLogoAction(orgSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Logo du club" className="h-full w-full object-contain" />
        ) : (
          <span className="text-3xl text-navy-300">🏓</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {isPending ? "..." : "Changer le logo"}
        </Button>
        {preview && (
          <Button variant="danger" size="sm" disabled={isPending} onClick={handleRemove}>
            Retirer
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-navy-400">PNG, JPEG, WEBP ou SVG — 500 Ko maximum.</p>
    </div>
  );
}
