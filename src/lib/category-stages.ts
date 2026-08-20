import type { Stage } from "@/components/ui/stage-tracker";

export function getCategoryStages(
  status: string,
  format: string,
  registrationCount: number
): Stage[] {
  const hasPools = format !== "DIRECT_BRACKET";
  const hasBracket = format !== "POOLS_ONLY";

  const joueurs: Stage = {
    label: "Joueurs",
    status: registrationCount > 0 ? "done" : "active",
  };

  const poulesDone = status === "POOLS_DONE" || status === "BRACKET_IN_PROGRESS" || status === "FINISHED";
  const poules: Stage = {
    label: "Poules",
    status: poulesDone ? "done" : status === "POOLS_IN_PROGRESS" ? "active" : "pending",
  };

  const finales: Stage = {
    label: "Finales",
    status: status === "FINISHED" ? "done" : status === "BRACKET_IN_PROGRESS" ? "active" : "pending",
  };

  const classement: Stage = {
    label: "Classement",
    status: status === "FINISHED" ? "done" : "pending",
  };

  const stages: Stage[] = [joueurs];
  if (hasPools) stages.push(poules);
  if (hasBracket) stages.push(finales);
  stages.push(classement);
  return stages;
}
