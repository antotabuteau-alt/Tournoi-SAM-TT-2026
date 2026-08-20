"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/lib/action-result";
import { AuthCard } from "../auth-card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <AuthCard
      title="Créer mon club"
      subtitle="Gratuit, prêt en 1 minute"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-accent-500 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Label>
          Ton nom
          <Input type="text" name="name" required autoComplete="name" />
        </Label>

        <Label>
          Email
          <Input type="email" name="email" required autoComplete="email" />
        </Label>

        <Label>
          Mot de passe
          <Input type="password" name="password" required minLength={10} autoComplete="new-password" />
        </Label>

        <Label>
          Nom du club / association
          <Input type="text" name="organizationName" required />
        </Label>

        {state && "error" in state && (
          <p className="text-sm text-danger-600">{state.error}</p>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={isPending} className="mt-2">
          {isPending ? "Création..." : "Créer mon compte"}
        </Button>
      </form>
    </AuthCard>
  );
}
