import type { Stage } from "@/components/ui/stage-tracker";

export function getCategoryStages(
  status: string,
  format: string,
  registrationCount: number,
  links: { orgSlug: string; tournamentId: string; categoryId: string }
): Stage[] {
  const hasPools = format !== "DIRECT_BRACKET";
  const hasBracket = format !== "POOLS_ONLY";
  const base = `/${links.orgSlug}/tournaments/${links.tournamentId}/categories/${links.categoryId}`;

  const joueurs: Stage = {
    label: "Joueurs",
    status: registrationCount > 0 ? "done" : "active",
    href: base,
  };

  const poulesDone = status === "POOLS_DONE" || status === "BRACKET_IN_PROGRESS" || status === "FINISHED";
  const poules: Stage = {
    label: "Poules",
    status: poulesDone ? "done" : status === "POOLS_IN_PROGRESS" ? "active" : "pending",
    href: `${base}/pools`,
  };

  const finales: Stage = {
    label: "Finales",
    status: status === "FINISHED" ? "done" : status === "BRACKET_IN_PROGRESS" ? "active" : "pending",
    href: `${base}/bracket`,
  };

  const classement: Stage = {
    label: "Classement",
    status: status === "FINISHED" ? "done" : "pending",
    href: `${base}/bracket`,
  };

  const stages: Stage[] = [joueurs];
  if (hasPools) stages.push(poules);
  if (hasBracket) stages.push(finales);
  stages.push(classement);
  return stages;
}
