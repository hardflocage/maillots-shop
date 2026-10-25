# Mise en ligne pas à pas

Comptez environ 1 h. Vous aurez besoin de comptes **GitHub**, **Supabase**, **Vercel**, **Stripe** et **Resend** (tous gratuits pour démarrer).

## 1. Base de données et photos : Supabase

1. Sur [supabase.com](https://supabase.com) › **New project** (région : Paris `eu-west-3`). Notez le mot de passe de la base.
2. **Project Settings › Database › Connection string › URI** :
   - copiez l'URL **Transaction pooler** (port `6543`), ajoutez `?pgbouncer=true` à la fin → `DATABASE_URL`
   - copiez l'URL **Session pooler** ou directe (port `5432`) → `DIRECT_URL`
3. **Storage › New bucket** : nom `products`, cochez **Public bucket**.
4. **Project Settings › API** : copiez `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` et la clé `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
   (⚠️ clé secrète : uniquement dans Vercel, jamais dans le code).

## 2. Créer les tables et votre compte administrateur

Sur votre ordinateur, dans le dossier du projet, avec un fichier `.env` contenant `DATABASE_URL` et `DIRECT_URL` de Supabase :

```bash
npm install
npm run db:migrate
npm run db:seed
npm run create-admin -- vous@votre-domaine.fr "UnMotDePasseLongEtUnique"
# facultatif, pour tester avant d'ajouter vos maillots :
npm run db:demo
```

## 3. Hébergement : Vercel

1. [vercel.com](https://vercel.com) › **Add New › Project** › importez le dépôt GitHub `maillots-shop`.
2. **Environment Variables** : ajoutez toutes les variables de `.env.example` :

| Variable | Valeur |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | étape 1 |
| `AUTH_SECRET` | chaîne aléatoire : `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.votre-domaine.fr` (sans `/` final) |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=products` | étape 1 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | étape 4 |
| `RESEND_API_KEY`, `EMAIL_FROM` | étape 5 |
| `CRON_SECRET` | chaîne aléatoire (Vercel l'envoie automatiquement à la tâche planifiée) |

3. **Deploy**. Puis **Settings › Domains** pour brancher votre nom de domaine.
4. Après chaque modification de variable : **Deployments › … › Redeploy**.

La tâche planifiée (`vercel.json`) tourne une fois par jour : elle libère les réservations de stock expirées
(c'est aussi fait automatiquement à chaque commande) et envoie les rappels de panier autorisés.

## 4. Paiements : Stripe

1. [dashboard.stripe.com](https://dashboard.stripe.com) : activez votre compte (identité, IBAN) pour recevoir de vrais paiements.
2. **Commencez en mode test** : **Développeurs › Clés API** › copiez la clé secrète `sk_test_…` → `STRIPE_SECRET_KEY`.
3. **Développeurs › Webhooks › Ajouter un endpoint** :
   - URL : `https://www.votre-domaine.fr/api/webhooks/stripe`
   - évènements : `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
   - copiez le **secret de signature** `whsec_…` → `STRIPE_WEBHOOK_SECRET`
4. **Paramètres › Moyens de paiement** : activez Cartes, **Apple Pay** et **Google Pay** (ils s'affichent automatiquement sur les appareils compatibles).
5. Testez une commande avec la carte `4242 4242 4242 4242` (date future, CVC quelconque) et une carte refusée `4000 0000 0000 0002`.
6. Quand tout est validé : refaites les étapes 2 et 3 en **mode live** (`sk_live_…`, nouveau webhook live) et redéployez.

Le site ne stocke **jamais** de numéro de carte : la saisie se fait sur la page sécurisée de Stripe.
Une commande ne passe « Payée » qu'après confirmation signée de Stripe.

## 5. E-mails : Resend

1. [resend.com](https://resend.com) › **Domains** › ajoutez votre domaine et créez les enregistrements DNS indiqués.
2. **API Keys** › créez une clé → `RESEND_API_KEY`.
3. `EMAIL_FROM="Nom de la boutique <commandes@votre-domaine.fr>"` (adresse du domaine vérifié).

## 6. Dans l'administration (`/admin`)

1. **Paramètres** : nom, slogan, e-mail de contact, e-mail des alertes, réseaux sociaux, image d'accueil.
2. **Pages & textes légaux** : remplacez toutes les mentions **[À COMPLÉTER]**.
3. **Livraison** : vos vrais tarifs, seuil de gratuité et délais annoncés par votre transporteur.
4. **Produits** : supprimez les produits démo, ajoutez vos maillots (photo devant + photo dos + tailles et stock).
5. Suivez la [checklist d'ouverture](CHECKLIST-OUVERTURE.md).

## Mettre à jour le site

Toute modification poussée sur la branche `main` de GitHub est redéployée automatiquement par Vercel.
Si le schéma de la base change (nouveau dossier dans `prisma/migrations`), lancez `npm run db:migrate` avec l'URL de production.
