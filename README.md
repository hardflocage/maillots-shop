# Boutique de maillots de football

Site e-commerce complet : catalogue, fiches produits **devant / dos** (zoom, glisser au doigt), **flocage** avec aperçu,
**stock par taille**, panier, **paiement Stripe** (carte, Apple Pay, Google Pay), comptes clients facultatifs et
**administration** complète (produits, photos, stocks, commandes, remboursements, promotions, livraison, pages légales, statistiques).

| Technologie | Rôle |
|---|---|
| Next.js 15 (App Router) + React 19 + TypeScript | Site et API |
| Tailwind CSS | Design noir premium, responsive |
| PostgreSQL (Supabase) + Prisma | Base de données |
| Stripe Checkout + webhooks | Paiement sécurisé validé côté serveur |
| Supabase Storage | Photos des maillots |
| Resend | E-mails (confirmation, expédition, remboursement, mot de passe) |

➡️ **Mise en ligne pas à pas : [DEPLOIEMENT.md](DEPLOIEMENT.md)**
➡️ **Vérifications avant ouverture : [CHECKLIST-OUVERTURE.md](CHECKLIST-OUVERTURE.md)**

## Démarrer en local

```bash
npm install
cp .env.example .env          # puis renseignez DATABASE_URL, DIRECT_URL et AUTH_SECRET
npm run db:migrate            # crée les tables
npm run db:seed               # catégories, livraison, pages légales à compléter
npm run db:demo               # (facultatif) 13 maillots de démonstration + code DEMO10
npm run create-admin -- vous@exemple.fr "MotDePasseSolide"
npm run dev                   # http://localhost:3000  ·  admin : http://localhost:3000/admin
```

Sans clé Stripe, le site fonctionne mais **le paiement est clairement désactivé** (aucune commande n'est créée).
Sans Resend, les e-mails ne partent pas (ils sont seulement notés dans les journaux du serveur).

## Tests

```bash
npm test                      # tests unitaires (prix, remises, flocage, sécurité du contenu)
npm run test:integration      # tests sur une vraie base PostgreSQL de test (.env.test) : stock, paiement, remboursements
npm run test:e2e              # parcours complet dans un navigateur (serveur lancé, produits démo présents)
```

Pour `test:e2e` : `npx playwright install chromium` la première fois, puis
`BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:e2e`.

## Ce qui est réel, et ce qui demande votre configuration

| Fonction | État |
|---|---|
| Catalogue, filtres, recherche, fiches produit, devant/dos, zoom, swipe | ✅ Fonctionnel |
| Stock par taille, tailles épuisées, protection contre la survente (réservation atomique) | ✅ Fonctionnel, testé |
| Panier, codes promo, remises multi-maillots, frais de port, livraison offerte | ✅ Recalculé côté serveur |
| Paiement Stripe, confirmation après validation réelle, anti-doublon, remboursements | ✅ Code complet, **nécessite vos clés Stripe** |
| E-mails transactionnels | ✅ Code complet, **nécessite une clé Resend** |
| Photos en ligne | ✅ **nécessite Supabase Storage** (en local : dossier `uploads/`) |
| Point relais | ⚠️ Mode configurable, mais **aucun transporteur n'est connecté** : le client saisit son point relais. Une carte Mondial Relay / Boxtal demande votre compte transporteur. |
| Suivi de colis | ✅ Numéro et lien saisis par vous dans l'admin ; aucun faux suivi n'est affiché |
| Avis clients | ✅ Uniquement des acheteurs dont la commande est livrée, après votre validation. Aucun faux avis. |
| Rappel de panier abandonné | ✅ Un seul e-mail, uniquement si le client a coché la case, via la tâche planifiée quotidienne |
| Pages légales | ⚠️ Modèles à compléter (mentions **[À COMPLÉTER]**) depuis Admin › Pages |
| Produits de démonstration | ⚠️ Badge « Démo », visuels génériques. Suppression en un clic dans l'admin. |

## Organisation du code

```
prisma/            schéma de la base, migrations, données de base, produits démo
src/app/(shop)/    pages publiques (accueil, boutique, maillot, panier, commande, compte, suivi, pages)
src/app/admin/     administration (protégée)
src/app/api/       panier, paiement, webhook Stripe, recherche, tâches planifiées
src/app/actions/   actions serveur (formulaires)
src/lib/           logique métier : prix, stock, commandes, Stripe, e-mails, stockage, authentification
tests/             tests unitaires, intégration (base réelle) et navigateur
```
