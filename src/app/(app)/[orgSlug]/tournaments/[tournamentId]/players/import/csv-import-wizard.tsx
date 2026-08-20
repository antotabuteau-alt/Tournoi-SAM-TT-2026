"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { importPlayersAction } from "@/actions/players.actions";
import {
  PLAYER_CSV_FIELDS,
  csvPlayerRowSchema,
  type CsvPlayerRow,
} from "@/lib/validators/player.schema";

type Step = "upload" | "mapping" | "review";

type FieldKey = (typeof PLAYER_CSV_FIELDS)[number]["key"];
type ColumnMapping = Partial<Record<FieldKey, string>>;

const NONE = "__none__";

export function CsvImportWizard({
  orgSlug,
  tournamentId,
}: {
  orgSlug: string;
  tournamentId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number } | null>(null);

  function handleFile(file: File) {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? [];
        setHeaders(cols);
        setRawRows(results.data);

        // Pré-remplissage automatique si les en-têtes correspondent déjà
        const autoMapping: ColumnMapping = {};
        for (const field of PLAYER_CSV_FIELDS) {
          const match = cols.find(
            (c) => c.trim().toLowerCase() === field.label.toLowerCase() ||
              c.trim().toLowerCase() === field.key.toLowerCase()
          );
          if (match) autoMapping[field.key] = match;
        }
        setMapping(autoMapping);
        setStep("mapping");
      },
      error: (err) => setError(err.message),
    });
  }

  const { validRows, invalidCount } = useMemo(() => {
    if (step !== "review") return { validRows: [] as CsvPlayerRow[], invalidCount: 0 };

    const valid: CsvPlayerRow[] = [];
    let invalid = 0;
    for (const raw of rawRows) {
      const candidate = {
        firstName: mapping.firstName ? raw[mapping.firstName] ?? "" : "",
        lastName: mapping.lastName ? raw[mapping.lastName] ?? "" : "",
        club: mapping.club ? raw[mapping.club] ?? "" : "",
        licenseNumber: mapping.licenseNumber ? raw[mapping.licenseNumber] ?? "" : "",
        email: mapping.email ? raw[mapping.email] ?? "" : "",
        phone: mapping.phone ? raw[mapping.phone] ?? "" : "",
      };
      const parsed = csvPlayerRowSchema.safeParse(candidate);
      if (parsed.success) valid.push(parsed.data);
      else invalid += 1;
    }
    return { validRows: valid, invalidCount: invalid };
  }, [step, rawRows, mapping]);

  async function handleConfirm() {
    setIsImporting(true);
    setError(null);
    const res = await importPlayersAction(orgSlug, tournamentId, validRows);
    setIsImporting(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult({ imported: res.imported ?? validRows.length });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-green-700">
          {result.imported} joueur(s) importé(s) avec succès.
        </p>
        <button
          onClick={() =>
            router.push(`/${orgSlug}/tournaments/${tournamentId}/players`)
          }
          className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Voir les joueurs
        </button>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground/70">
          Fichier CSV avec en-têtes (première ligne = noms de colonnes).
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (step === "mapping") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground/70">
          {rawRows.length} ligne(s) détectée(s). Associe chaque champ à une colonne du fichier.
        </p>
        {PLAYER_CSV_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-sm">
            {field.label}
            {field.required && <span className="text-red-600"> *</span>}
            <select
              value={mapping[field.key] ?? NONE}
              onChange={(e) =>
                setMapping((m) => ({
                  ...m,
                  [field.key]: e.target.value === NONE ? undefined : e.target.value,
                }))
              }
              className="rounded-md border border-black/15 px-3 py-2"
            >
              <option value={NONE}>-- Aucune --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          disabled={!mapping.firstName || !mapping.lastName}
          onClick={() => setStep("review")}
          className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Valider les correspondances
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <span className="text-green-700">{validRows.length} ligne(s) valide(s)</span>
        {invalidCount > 0 && (
          <span className="ml-2 text-red-600">{invalidCount} ligne(s) ignorée(s) (prénom/nom manquant)</span>
        )}
      </p>

      <ul className="max-h-64 overflow-y-auto rounded-md border border-black/10 text-sm">
        {validRows.slice(0, 20).map((row, i) => (
          <li key={i} className="border-b border-black/5 px-3 py-1.5 last:border-0">
            {row.firstName} {row.lastName}
            {row.club ? ` — ${row.club}` : ""}
          </li>
        ))}
        {validRows.length > 20 && (
          <li className="px-3 py-1.5 text-foreground/50">
            + {validRows.length - 20} autre(s)
          </li>
        )}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => setStep("mapping")}
          className="rounded-md border border-black/10 px-4 py-2 text-sm"
        >
          Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={isImporting || validRows.length === 0}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isImporting ? "Import..." : `Confirmer l'import (${validRows.length})`}
        </button>
      </div>
    </div>
  );
}
