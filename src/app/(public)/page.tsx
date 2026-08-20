import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-navy-950 text-white">
      <header>
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500">
              🏓
            </span>
            SAM TT <span className="text-accent-500">Tournoi</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-navy-300 hover:text-white">
              Connexion
            </Link>
            <LinkButton href="/register" variant="accent">
              Créer mon club
            </LinkButton>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center gap-6 px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Organisez vos tournois
          <br />
          de tennis de table
        </h1>
        <p className="max-w-2xl text-lg text-navy-300">
          Poules en serpent ou en drag &amp; drop, import de joueurs par CSV,
          saisie des scores, tableau final à élimination directe, et un mode
          TV en direct suivi par QR code par vos participants.
        </p>
        <div className="flex flex-wrap gap-4">
          <LinkButton href="/register" variant="accent" size="lg">
            Commencer gratuitement
          </LinkButton>
          <LinkButton
            href="/login"
            variant="outline"
            size="lg"
            className="border-white/20 bg-transparent text-white hover:bg-white/5"
          >
            J&apos;ai déjà un compte
          </LinkButton>
        </div>
      </main>
    </div>
  );
}
