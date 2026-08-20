"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-bold">Connexion</h1>

      <form action={formAction} className="flex flex-col gap-4">
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
            autoComplete="current-password"
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
          {isPending ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="text-sm text-foreground/70">
        Pas encore de compte ?{" "}
        <Link href="/register" className="underline">
          Créer mon club
        </Link>
      </p>
    </div>
  );
}
