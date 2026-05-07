const TYPES = {
  new: { l: "Nouveau",      bg: "rgba(22,163,74,.1)",   brd: "rgba(22,163,74,.3)",   c: "#16a34a" },
  imp: { l: "Amélioration", bg: "rgba(79,70,229,.1)",   brd: "rgba(79,70,229,.3)",   c: "#4f46e5" },
  fix: { l: "Correction",   bg: "rgba(217,119,6,.1)",   brd: "rgba(217,119,6,.3)",   c: "#d97706" },
};

const CHANGELOG = [
  {
    version: "1.5",
    date: "Mai 2026",
    latest: true,
    entries: [
      { type: "new", text: "Module Commandes : créez des commandes fournisseur regroupant plusieurs articles liés à une activité" },
      { type: "new", text: "Liaison article → fiche produit : cliquez sur un article de commande pour accéder directement au produit" },
      { type: "new", text: "4 statuts de commande : En attente, Reçu partiel, Reçu, Annulé" },
      { type: "new", text: "Prix total de commande calculé automatiquement (quantité × prix unitaire)" },
      { type: "new", text: "Les commandes supprimées passent par la corbeille (récupération sous 30 jours)" },
      { type: "new", text: "Création de produit en ligne depuis une commande : le nouveau produit est directement pré-sélectionné dans l'article" },
      { type: "new", text: "Partenaire inclus directement depuis la fiche produit lors d'une vente (onglet Produits)" },
      { type: "new", text: "Partenaire modifiable lors de la modification d'une vente (onglet Ventes) — ajout, changement ou suppression" },
      { type: "fix", text: "Suppression définitive d'un produit : les photos sont maintenant effacées du stockage (purge individuelle et vider la corbeille)" },
      { type: "fix", text: "Compteur de la corbeille : les réservations supprimées étaient absentes du décompte" },
      { type: "fix", text: "Trésorerie : la valeur du stock n'est plus soustraite quand un filtre de période est actif" },
      { type: "new", text: "Cette page Nouveautés" },
    ],
  },
  {
    version: "1.4",
    date: "Avr. 2026",
    entries: [
      { type: "new", text: "Trésorerie dans le dashboard (vue globale flux entrants / sortants)" },
      { type: "new", text: "Filtres avancés sur le dashboard : par période (7j / mois / 3 mois / an / personnalisé) et par activité" },
      { type: "new", text: "Page Frais dédiée pour suivre les dépenses liées à chaque activité ou produit" },
      { type: "new", text: "Acomptes sur les produits : enregistrez un paiement partiel et soldez plus tard" },
      { type: "fix", text: "Confirmation obligatoire avant suppression d'un frais" },
    ],
  },
  {
    version: "1.3",
    date: "Avr. 2026",
    entries: [
      { type: "new", text: "Galerie photos sur les produits : ajoutez jusqu'à 5 photos par produit" },
      { type: "imp", text: "Compression automatique des images avant upload pour réduire la taille de stockage" },
    ],
  },
  {
    version: "1.2",
    date: "Avr. 2026",
    entries: [
      { type: "fix", text: "Menu latéral fixe sur desktop : reste visible pendant le défilement" },
      { type: "imp", text: "Focus automatique sur les champs de formulaire à l'ouverture des modals" },
      { type: "fix", text: "Calcul de l'acompte correctement pris en compte dans le CA et le stock" },
      { type: "imp", text: "Annulation de vente : possibilité de choisir si le stock doit être réintégré" },
    ],
  },
  {
    version: "1.1",
    date: "Mar. 2026",
    entries: [
      { type: "fix", text: "Rollback optimiste : les données reviennent à l'état initial en cas d'erreur réseau" },
      { type: "fix", text: "Blocage de la saisie de stock négatif" },
      { type: "imp", text: "Statistiques partenaires : affichage du montant dû et historique des paiements" },
      { type: "fix", text: "Édition des activités : le formulaire se préremplissait incorrectement" },
      { type: "imp", text: "Animation de chargement au démarrage de l'application" },
    ],
  },
  {
    version: "1.0",
    date: "Mar. 2026",
    label: "Lancement",
    entries: [
      { type: "new", text: "Dashboard : KPIs CA, bénéfice, marge, nombre de ventes avec graphiques" },
      { type: "new", text: "Produits & Stock : suivi par tailles multiples (S / M / L / XL / XXL), alertes stock bas" },
      { type: "new", text: "Ventes : enregistrement avec acomptes, partage de commissions entre partenaires" },
      { type: "new", text: "Locations : actifs locatifs et réservations avec statuts" },
      { type: "new", text: "Partenaires : suivi des montants dus et historique des paiements" },
      { type: "new", text: "Abonnements et charges récurrentes (mensuel / annuel / hebdo)" },
      { type: "new", text: "Activités : organisez toutes vos données par business ou projet" },
      { type: "new", text: "Corbeille : récupération des éléments supprimés pendant 30 jours" },
      { type: "new", text: "Mode sombre / clair avec persistance de la préférence" },
    ],
  },
];

export default function Changelog() {
  return (
    <div style={{ maxWidth: 720 }}>
      {/* Intro */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.7 }}>
          Retrouvez ici toutes les mises à jour de BusinessHub — nouvelles fonctionnalités, améliorations et corrections.
        </p>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {/* Ligne verticale */}
        <div style={{ position: "absolute", left: 83, top: 0, bottom: 0, width: 1, background: "var(--brd)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {CHANGELOG.map((release, ri) => (
            <div key={release.version} style={{ display: "flex", gap: 0, alignItems: "flex-start", marginBottom: ri < CHANGELOG.length - 1 ? 32 : 0 }}>
              {/* Colonne gauche : version + date */}
              <div style={{ width: 84, flexShrink: 0, paddingRight: 24, textAlign: "right", paddingTop: 3 }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 9px",
                    background: release.latest ? "var(--ac)" : "var(--surf)",
                    color: release.latest ? "#fff" : "var(--sub)",
                    border: `1px solid ${release.latest ? "var(--ac)" : "var(--brd)"}`,
                    borderRadius: 20, whiteSpace: "nowrap",
                  }}>
                    {release.label ?? `v${release.version}`}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--mut)", whiteSpace: "nowrap" }}>{release.date}</span>
                </div>
              </div>

              {/* Point sur la ligne */}
              <div style={{ position: "relative", flexShrink: 0, marginTop: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: release.latest ? "var(--ac)" : "var(--brd)",
                  border: `2px solid ${release.latest ? "var(--ac)" : "var(--surf)"}`,
                  boxShadow: release.latest ? "0 0 0 3px rgba(79,70,229,.2)" : "none",
                  marginLeft: -4,
                }} />
              </div>

              {/* Contenu */}
              <div style={{ flex: 1, paddingLeft: 20 }}>
                <div style={{
                  background: "var(--w)", border: "1px solid var(--brd)",
                  borderRadius: 12, padding: "16px 18px",
                  boxShadow: "var(--sh)",
                }}>
                  {release.entries.map((e, i) => {
                    const t = TYPES[e.type];
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0,
                        borderTop: i > 0 ? "1px solid var(--brd)" : "none",
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px",
                          background: t.bg, border: `1px solid ${t.brd}`,
                          borderRadius: 20, color: t.c, whiteSpace: "nowrap",
                          flexShrink: 0, marginTop: 1,
                        }}>
                          {t.l}
                        </span>
                        <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.5 }}>{e.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
