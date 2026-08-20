"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-bold">Créer mon club</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Ton nom
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            name="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Nom du club / association
          <input
            type="text"
            name="organizationName"
            required
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>

        {state && "error" in state && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-foreground px-4 py-2 text-background font-medium disabled:opacity-50"
        >
          {isPending ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="text-sm text-foreground/70">
        Déjà un compte ?{" "}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
