import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-semibold">SAM TT Tournoi</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="hover:underline">
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-foreground px-4 py-2 text-background"
            >
              Créer mon club
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center gap-6 px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Organisez vos tournois de tennis de table
        </h1>
        <p className="max-w-2xl text-lg text-foreground/70">
          Poules en serpent ou en drag &amp; drop, import de joueurs par CSV,
          saisie des scores, tableau final à élimination directe, et un mode
          TV en direct suivi par QR code par vos participants.
        </p>
        <div className="flex gap-4">
          <Link
            href="/register"
            className="rounded-md bg-foreground px-6 py-3 text-background font-medium"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-black/10 px-6 py-3 font-medium"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </main>
    </div>
  );
}
