"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  addPlayerToCategoryManuallyAction,
  generateTestPlayersForCategoryAction,
  importCsvPlayersToCategoryAction,
} from "@/actions/category-players.actions";

interface RegisteredPlayer {
  id: string;
  firstName: string;
  lastName: string;
  rankingPoints: number | null;
}

export function CategoryPlayersModal({
  orgSlug,
  tournamentId,
  categoryId,
  categoryName,
  initialPlayers,
  onClose,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  categoryName: string;
  initialPlayers: RegisteredPlayer[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [players, setPlayers] = useState(initialPlayers);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");
  const [testCount, setTestCount] = useState(8);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function refreshFromServer() {
    router.refresh();
  }

  function handleAddManual() {
    if (!name.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    if (points.trim()) fd.set("points", points.trim());
    startTransition(async () => {
      const res = await addPlayerToCategoryManuallyAction(orgSlug, tournamentId, categoryId, fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const [firstName, ...rest] = name.trim().split(/\s+/);
      setPlayers((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          firstName,
          lastName: rest.join(" "),
          rankingPoints: points.trim() ? Number(points) : null,
        },
      ]);
      setName("");
      setPoints("");
      refreshFromServer();
    });
  }

  function handleGenerateTest() {
    setError(null);
    startTransition(async () => {
      const res = await generateTestPlayersForCategoryAction(orgSlug, tournamentId, categoryId, testCount);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPlayers((prev) => [...prev, ...(res.created ?? [])]);
      refreshFromServer();
    });
  }

  function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCsvSummary(null);
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .map((row) => ({
            name: (row[0] ?? "").trim(),
            points: row[1] !== undefined && row[1] !== "" ? Number(row[1]) : undefined,
          }))
          .filter((r) => r.name && r.name.toLowerCase() !== "name");

        if (rows.length === 0) {
          setError("Fichier CSV vide ou format invalide (attendu : name,score).");
          return;
        }

        startTransition(async () => {
          const res = await importCsvPlayersToCategoryAction(orgSlug, tournamentId, categoryId, rows);
          if ("error" in res) {
            setError(res.error);
            return;
          }
          const imported = res.imported ?? [];
          setPlayers((prev) => [...prev, ...imported]);
          setCsvSummary(`${imported.length} joueur(s) importé(s).`);
          if (fileRef.current) fileRef.current.value = "";
          refreshFromServer();
        });
      },
      error: () => setError("Impossible de lire ce fichier CSV."),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold">
            👥 Joueurs — {categoryName}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:bg-surface-muted"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          {players.length === 0 ? (
            <p className="py-4 text-center text-sm text-navy-400">Aucun joueur enregistré.</p>
          ) : (
            <ul className="flex max-h-40 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {players.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                  <span>{p.firstName} {p.lastName}</span>
                  {p.rankingPoints !== null && (
                    <span className="text-xs text-navy-400">{p.rankingPoints} pts</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              🔍 Ajouter un licencié · recherche FFTT
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-navy-500 ring-1 ring-navy-500/10">
                Bientôt disponible
              </span>
            </p>
            <input
              disabled
              placeholder="Nom du joueur ou n° de licence…"
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-border bg-white/60 px-3 py-2 text-sm text-navy-300"
            />
            <p className="mt-1.5 text-xs text-navy-400">
              Le classement officiel deviendra le niveau (têtes de série &amp; handicaps).
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">+ Ajouter manuellement</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nom du joueur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Points"
                min={0}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddManual}
                disabled={isPending || !name.trim()}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">📁 Importer un fichier CSV</p>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvChange}
                disabled={isPending}
                className="flex-1 text-xs text-navy-400 file:mr-2 file:rounded-lg file:border file:border-border file:bg-surface-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
              />
            </div>
            <p className="mt-1.5 text-xs text-navy-400">Format : name,score</p>
            {csvSummary && <p className="mt-1 text-xs text-success-600">{csvSummary}</p>}
          </div>

          <details className="rounded-xl border border-dashed border-accent-400/60 bg-accent-50/40 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-accent-600">
              🎉 Outils de test
            </summary>
            <div className="mt-3 flex items-center gap-2">
              <select
                value={testCount}
                onChange={(e) => setTestCount(Number(e.target.value))}
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
              >
                {[4, 8, 16, 24, 32].map((n) => (
                  <option key={n} value={n}>{n} joueurs</option>
                ))}
              </select>
              <button
                onClick={handleGenerateTest}
                disabled={isPending}
                className="rounded-lg border border-accent-400 bg-white px-3 py-1.5 text-sm font-medium text-accent-600 hover:bg-accent-50 disabled:opacity-50"
              >
                ✨ Générer
              </button>
            </div>
          </details>

          {error && <p className="text-sm text-danger-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
