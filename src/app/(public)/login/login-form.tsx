"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/lib/action-result";
import { AuthCard } from "../auth-card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <AuthCard
      title="🔐 Connexion"
      subtitle="Accède à ton espace organisateur"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-accent-500 hover:underline">
            Créer mon club
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Label>
          Email
          <Input type="email" name="email" required autoComplete="email" />
        </Label>

        <Label>
          Mot de passe
          <Input type="password" name="password" required autoComplete="current-password" />
        </Label>

        {state && "error" in state && (
          <p className="text-sm text-danger-600">{state.error}</p>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={isPending} className="mt-2">
          {isPending ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </AuthCard>
  );
}
