"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "@/actions/category-settings.actions";
import { CategorySettingsPanel } from "./category-settings-panel";

type BracketType = "CLASSIC" | "INTEGRAL_BY_LEVEL" | "INTEGRAL_OFFICIAL_FFTT" | "MAIN_PLUS_CONSOLATION";

export function CategoryActionsMenu({
  orgSlug,
  tournamentId,
  categoryId,
  categoryName,
  scheduledAt,
  bracketType,
  poolQualifiersCount,
  repechage,
  poolCount,
  tableRangeStart,
  tableRangeEnd,
  registrationCount,
  onDeleted,
  onScheduleUpdated,
  onNameUpdated,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  categoryName: string;
  scheduledAt: Date | null;
  bracketType: BracketType;
  poolQualifiersCount: number;
  repechage: boolean;
  poolCount: number | null;
  tableRangeStart: number | null;
  tableRangeEnd: number | null;
  registrationCount: number;
  onDeleted?: () => void;
  onScheduleUpdated?: (scheduledAt: Date) => void;
  onNameUpdated?: (name: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setMenuOpen(false);
    if (!window.confirm(`Supprimer le tableau "${categoryName}" ? Cette action supprime aussi les joueurs inscrits, poules et matchs de ce tableau. Irréversible.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteCategoryAction(orgSlug, tournamentId, categoryId);
      if ("error" in res) {
        alert(res.error);
        return;
      }
      onDeleted?.();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:bg-surface-muted disabled:opacity-50"
        aria-label="Actions du tableau"
      >
        •••
      </button>

      {menuOpen && (
        <>
          <button
            aria-label="Fermer le menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
            <button
              onClick={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
            >
              ⚙ Réglages du tableau
            </button>
            <a
              href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools/print`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
            >
              🖨 Classement poules PDF
            </a>
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50"
            >
              🗑 Supprimer le tableau
            </button>
          </div>
        </>
      )}

      {settingsOpen && (
        <CategorySettingsPanel
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          categoryName={categoryName}
          scheduledAt={scheduledAt}
          bracketType={bracketType}
          poolQualifiersCount={poolQualifiersCount}
          repechage={repechage}
          poolCount={poolCount}
          tableRangeStart={tableRangeStart}
          tableRangeEnd={tableRangeEnd}
          registrationCount={registrationCount}
          onClose={() => setSettingsOpen(false)}
          onScheduleUpdated={onScheduleUpdated}
          onNameUpdated={onNameUpdated}
        />
      )}
    </div>
  );
}
