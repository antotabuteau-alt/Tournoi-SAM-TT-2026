"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { movePoolMemberAction, generatePoolMatchesAction } from "@/actions/pools.actions";

interface Member {
  registrationId: string;
  name: string;
}

interface PoolGroupView {
  id: string;
  name: string;
  members: Member[];
}

const UNASSIGNED = "__unassigned__";

function PlayerCard({ registrationId, name }: Member) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: registrationId,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      className={`cursor-grab rounded-md border border-black/10 bg-background px-3 py-2 text-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {name}
    </div>
  );
}

function Column({
  id,
  title,
  members,
}: {
  id: string;
  title: string;
  members: Member[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-40 flex-col gap-2 rounded-md border p-3 ${
        isOver ? "border-foreground bg-black/[.02]" : "border-black/10"
      }`}
    >
      <h3 className="text-sm font-semibold text-foreground/70">{title}</h3>
      {members.map((m) => (
        <PlayerCard key={m.registrationId} {...m} />
      ))}
    </div>
  );
}

export function PoolDndBoard({
  orgSlug,
  tournamentId,
  categoryId,
  poolGroups,
  unassigned,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  poolGroups: PoolGroupView[];
  unassigned: Member[];
}) {
  const router = useRouter();
  const [groups, setGroups] = useState(poolGroups);
  const [rest, setRest] = useState(unassigned);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function findMember(registrationId: string): Member | undefined {
    return (
      rest.find((m) => m.registrationId === registrationId) ??
      groups.flatMap((g) => g.members).find((m) => m.registrationId === registrationId)
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const registrationId = String(active.id);
    const targetId = String(over.id);
    const member = findMember(registrationId);
    if (!member) return;

    setRest((prev) => prev.filter((m) => m.registrationId !== registrationId));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        members: g.members.filter((m) => m.registrationId !== registrationId),
      }))
    );

    if (targetId === UNASSIGNED) {
      setRest((prev) => [...prev, member]);
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === targetId ? { ...g, members: [...g.members, member] } : g
        )
      );
    }

    startTransition(async () => {
      const res = await movePoolMemberAction(
        orgSlug,
        tournamentId,
        categoryId,
        registrationId,
        targetId === UNASSIGNED ? null : targetId
      );
      if ("error" in res) {
        setError(res.error);
        router.refresh();
      }
    });
  }

  function handleGenerateMatches() {
    setError(null);
    startTransition(async () => {
      const res = await generatePoolMatchesAction(orgSlug, tournamentId, categoryId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground/60">
          Glisse-dépose les joueurs entre les poules, puis valide pour générer les matchs.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          <Column id={UNASSIGNED} title="Non assignés" members={rest} />
          {groups.map((g) => (
            <Column key={g.id} id={g.id} title={g.name} members={g.members} />
          ))}
        </div>

        <button
          onClick={handleGenerateMatches}
          disabled={isPending}
          className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isPending ? "..." : "Valider les poules et générer les matchs"}
        </button>
      </div>
    </DndContext>
  );
}
