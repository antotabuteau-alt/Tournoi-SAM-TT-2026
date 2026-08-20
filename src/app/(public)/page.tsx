import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { BrandLogo } from "@/components/brand-logo";

function ComingSoonTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-navy-700 ring-1 ring-navy-700/10">
      Bientôt disponible
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-navy-400">{children}</p>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-navy-400">
      <span className="mt-0.5 text-success-600">✓</span>
      {children}
    </li>
  );
}

function BracketMockup() {
  return (
    <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-600/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
        <span className="ml-3 text-xs font-medium text-navy-400">
          Championnat du Club 2026 — Tableau A
        </span>
        <span className="ml-auto flex items-center gap-1 rounded bg-danger-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          ● LIVE
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 p-6 text-left text-xs">
        {[
          [
            ["Lucas Martin", "Manon Leroy"],
            ["Léa Thomas", "Nathan Robert"],
          ],
          [["Lucas Martin", "Léa Thomas"]],
          [["Vainqueur", ""]],
        ].map((round, i) => (
          <div key={i} className="flex flex-col justify-around gap-4">
            {round.map(([p1, p2], j) => (
              <div key={j} className="rounded-lg border border-border p-2">
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium text-foreground">{p1}</span>
                  {i === 0 && <span className="text-navy-400">3</span>}
                </div>
                <div className="flex items-center justify-between border-t border-border py-0.5">
                  <span className="text-navy-400">{p2}</span>
                  {i === 0 && <span className="text-navy-400">1</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="bg-navy-950 text-white">
        <header>
          <nav className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
            <span className="flex items-center gap-2 font-semibold">
              <BrandLogo size="sm" />
              Tournoi du SAM TT 2026
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-navy-300">
              100% gratuit
            </span>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <Link href="/login" className="text-navy-300 hover:text-white">
                Se connecter
              </Link>
              <LinkButton href="/register" variant="accent" size="sm">
                Créer mon club
              </LinkButton>
            </div>
          </nav>
        </header>

        <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-24 pt-16 text-center">
          <span className="inline-flex items-center rounded-full bg-success-500/15 px-3 py-1 text-xs font-medium text-success-500">
            🏓 Gestion de tournois de tennis de table
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Vos tournois de tennis de table,
            <br />
            <b className="text-accent-400">organisés sans prise de tête.</b>
          </h1>
          <p className="max-w-2xl text-lg text-navy-300">
            Import de joueurs, poules, finales, tables, saisie des scores,
            affichage en salle et suivi mobile — tout depuis le navigateur.
            Rien à installer, et c&apos;est gratuit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <LinkButton href="/register" variant="accent" size="lg">
              Créer mon club — gratuit
            </LinkButton>
            <LinkButton
              href="#apercu"
              variant="outline"
              size="lg"
              className="border-white/20 bg-transparent text-white hover:bg-white/5"
            >
              ▶ Voir l&apos;aperçu
            </LinkButton>
          </div>

          <BracketMockup />
        </main>
      </div>

      <section id="apercu" className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          <div>
            <span className="text-xs font-bold tracking-widest text-accent-500">
              AFFICHAGE SALLE
            </span>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              Un écran de salle qui en jette
            </h2>
            <p className="mt-3 text-navy-400">
              Branchez une TV : le diaporama fait défiler brackets, classements
              de poules, podium et matchs en cours. Vos joueurs suivent aussi
              depuis leur téléphone via un QR code.
            </p>
          </div>
          <div className="grid gap-6">
            <div>
              <h3 className="font-bold text-foreground">🏆 Le podium en direct</h3>
              <p className="mt-1 text-sm text-navy-400">
                Dès qu&apos;un tableau est terminé, son classement final
                s&apos;affiche en grand : champion, finaliste, et toutes les
                places.
              </p>
              <ul className="mt-2 space-y-1">
                <CheckItem>Thème clair ou sombre</CheckItem>
                <CheckItem>S&apos;adapte de 4 à 64+ joueurs</CheckItem>
                <CheckItem>Aucun défilement à gérer</CheckItem>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground">🏓 Où joue chaque poule</h3>
              <p className="mt-1 text-sm text-navy-400">
                Le numéro de table en grand, l&apos;état (en jeu / terminée /
                en attente) et un bandeau des matchs en cours.
              </p>
              <ul className="mt-2 space-y-1">
                <CheckItem>Attribution des tables automatique ou manuelle</CheckItem>
                <CheckItem>Lisible à l&apos;autre bout de la salle</CheckItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eff6ff] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-bold tracking-widest text-brand-500">
            CONNECTÉ À LA FFTT
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            La seule à parler le langage du ping 🏓
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-navy-400">
            Via l&apos;API officielle Smartping, l&apos;import direct depuis
            la base fédérale — fini la saisie des noms et l&apos;estimation
            des niveaux. <ComingSoonTag />
          </p>
          <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
            <FeatureCard icon="📥" title="Import des licenciés">
              Cherchez un joueur par nom ou n° de licence (tous clubs), ou
              collez une liste : nom et classement officiel récupérés tout
              seuls — têtes de série et handicaps justes.
            </FeatureCard>
            <FeatureCard icon="🆔" title="Clubs vérifiés">
              À l&apos;inscription, le club est validé dans la base FFTT par
              son numéro, avec son nom officiel. Pas de clubs fictifs.
            </FeatureCard>
            <FeatureCard icon="🗺️" title="Carte des clubs présents">
              Sur l&apos;écran de salle, une carte affiche tous les clubs
              venus au tournoi — un joli clin d&apos;œil pour vos visiteurs.
            </FeatureCard>
          </div>
        </div>
      </section>

      <section className="bg-[#f0fdf4] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-bold tracking-widest text-success-600">
            INSCRIPTIONS EN LIGNE · HELLOASSO
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Les inscrits arrivent tout seuls dans vos tableaux 🎟️
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-navy-400">
            Liez votre billetterie HelloAsso : chaque joueur qui s&apos;inscrit
            et paie en ligne est importé automatiquement dans le bon tableau.{" "}
            <ComingSoonTag />
          </p>
          <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
            <FeatureCard icon="🎟️" title="Import automatique">
              Vos inscriptions HelloAsso atterrissent dans les bons tableaux
              en un clic. Rejouable à volonté et sans doublon.
            </FeatureCard>
            <FeatureCard icon="🤝" title="Doubles & paiement sur place">
              Les paires sont reconstituées en un seul compétiteur, et les
              inscrits qui règlent à l&apos;accueil sont repérés avec le
              montant à encaisser.
            </FeatureCard>
            <FeatureCard icon="🖨️" title="Feuille de présence">
              Le jour J, imprimez un émargement par tableau : case Présent à
              cocher, qui paie sur place, et le total à encaisser.
            </FeatureCard>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-bold tracking-widest text-accent-500">
            TOUT-EN-UN
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            De l&apos;inscription au classement final
          </h2>
          <div className="mt-10 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon="🎯" title="Poules & matchs">
              Génération automatique des poules, classements provisoires en
              temps réel.
            </FeatureCard>
            <FeatureCard icon="🏆" title="Phases finales">
              Plusieurs formats de tableaux, y compris le classement intégral.
            </FeatureCard>
            <FeatureCard icon="🏓" title="Gestion des tables">
              Attribution auto des tables libres, ou à la main. Suivi des
              matchs en cours.
            </FeatureCard>
            <FeatureCard icon="📺" title="Affichage salle">
              Diaporama pour la TV + page mobile pour les spectateurs (QR
              code).
            </FeatureCard>
            <FeatureCard icon="🖨️" title="Feuilles & QR">
              Feuilles de match et de poule, prêtes à imprimer.
            </FeatureCard>
            <FeatureCard icon="📱" title="Multi-appareils">
              PC, tablette à la table de marque, téléphone. Rien à installer.
            </FeatureCard>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-xs font-bold tracking-widest text-accent-500">
            SIMPLE
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            En 3 étapes
          </h2>
          <div className="mt-10 grid gap-8 text-left sm:grid-cols-3">
            {[
              ["Crée ton tableau", "Importe tes joueurs, choisis le nombre de poules et le format des finales."],
              ["Saisis les scores", "Depuis une fenêtre unique : tables, scores set par set, feuilles à imprimer."],
              ["Diffuse", "Lance le diaporama sur la TV et partage le QR aux joueurs. C'est parti."],
            ].map(([title, text], i) => (
              <div key={title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-navy-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-muted px-6 py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="text-xs font-bold tracking-widest text-accent-500">
              PILOTAGE
            </span>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              Tout depuis une seule fenêtre
            </h2>
            <p className="mt-3 text-navy-400">
              Matchs en cours, tables, saisie de score, impression des
              feuilles, le bracket qui avance tout seul. Pensé pour aller
              vite le jour J.
            </p>
            <ul className="mt-4 space-y-1.5">
              <CheckItem>Mode tables automatique</CheckItem>
              <CheckItem>Saisie protégée pendant la frappe</CheckItem>
              <CheckItem>Validation de score côté serveur</CheckItem>
            </ul>
          </div>
          <div className="rounded-xl bg-navy-950 p-4 shadow-lg">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
            </div>
            <div className="space-y-2">
              {["Table 1 — Lucas Martin vs Manon Leroy", "Table 2 — Léa Thomas vs Nathan Robert", "Table 3 — libre"].map(
                (row) => (
                  <div
                    key={row}
                    className="rounded-lg bg-white/5 px-3 py-2 text-xs text-navy-300"
                  >
                    {row}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className="px-6 py-20 text-center text-white"
        style={{
          backgroundImage: "linear-gradient(135deg, #0a2342, #1a3a5c)",
        }}
      >
        <h2 className="text-2xl font-bold">Gratuit, et ça le restera 💛</h2>
        <p className="mx-auto mt-3 max-w-xl text-navy-300">
          Tournoi du SAM TT 2026 est développé pour les clubs de
          l&apos;association. Aucun abonnement, aucune carte bancaire
          requise.
        </p>
        <div className="mt-6">
          <LinkButton href="/register" variant="accent" size="lg">
            Créer mon club
          </LinkButton>
        </div>
      </section>

      <footer className="bg-navy-950 px-6 py-8 text-center text-sm text-navy-400">
        Tournoi du SAM TT 2026 — la gestion de tournois de tennis de table
        pour l&apos;association.
      </footer>
    </div>
  );
}
