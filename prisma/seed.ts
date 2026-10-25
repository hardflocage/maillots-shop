/**
 * Données de base INDISPENSABLES (sans produits) : paramètres, catégories, livraison, pages légales à compléter.
 * Sans danger à relancer : n'écrase pas ce que vous avez modifié.
 */
import { PrismaClient, type CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const categories: { name: string; slug: string; type: CategoryType; sortOrder: number }[] = [
  { name: "Ligue 1", slug: "ligue-1", type: "LEAGUE", sortOrder: 1 },
  { name: "Premier League", slug: "premier-league", type: "LEAGUE", sortOrder: 2 },
  { name: "Liga", slug: "liga", type: "LEAGUE", sortOrder: 3 },
  { name: "Serie A", slug: "serie-a", type: "LEAGUE", sortOrder: 4 },
  { name: "Bundesliga", slug: "bundesliga", type: "LEAGUE", sortOrder: 5 },
  { name: "Ligue des champions", slug: "ligue-des-champions", type: "COMPETITION", sortOrder: 6 },
  { name: "Sélections nationales", slug: "selections-nationales", type: "NATIONAL", sortOrder: 7 },
  { name: "Maillots rétro", slug: "retro", type: "RETRO", sortOrder: 8 },
];

const TODO = "**[À COMPLÉTER]**";

const pages: { slug: string; title: string; content: string }[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    content: `## Éditeur du site
- Raison sociale : ${TODO}
- Forme juridique et capital : ${TODO}
- Adresse du siège : ${TODO}
- SIRET / RCS : ${TODO}
- N° TVA intracommunautaire : ${TODO}
- Directeur de la publication : ${TODO}
- Contact : ${TODO}

## Hébergement
- Hébergeur : ${TODO} (ex. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA)

## Propriété intellectuelle
Les contenus de ce site (textes, photos, logos) sont protégés. Toute reproduction sans autorisation est interdite.`,
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    content: `Ces conditions sont un modèle de structure. ${TODO} Faites-les relire par un professionnel avant l'ouverture.

## 1. Objet
Les présentes conditions régissent les ventes conclues sur ce site entre ${TODO} (le vendeur) et tout client.

## 2. Produits
Les caractéristiques des maillots (club, saison, type, tailles) sont présentées sur chaque fiche produit. Les photos sont celles des articles vendus. Le flocage personnalisé est réalisé selon les informations saisies par le client.

## 3. Prix
Les prix sont indiqués en euros TTC, hors frais de livraison, affichés avant validation de la commande.

## 4. Commande et paiement
La commande est définitive après confirmation du paiement par notre prestataire Stripe. Aucune donnée bancaire n'est conservée par le vendeur.

## 5. Livraison
Voir la [politique de livraison](/pages/livraison).

## 6. Droit de rétractation
Le client dispose de 14 jours à compter de la réception pour se rétracter. **Conformément à l'article L221-28 du Code de la consommation, ce droit ne s'applique pas aux articles personnalisés (flocage nom/numéro).** Voir la [politique de retour](/pages/retours).

## 7. Garanties légales
Garantie légale de conformité et garantie des vices cachés : ${TODO}

## 8. Médiation
Médiateur de la consommation : ${TODO}

## 9. Droit applicable
Droit français.`,
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    content: `## Responsable du traitement
${TODO}

## Données collectées
- Commande : nom, adresse, e-mail, téléphone (exécution du contrat).
- Compte client facultatif : e-mail, mot de passe chiffré, adresses.
- Newsletter : e-mail, uniquement avec votre consentement.
- Paiement : traité directement par Stripe. Nous ne recevons ni ne stockons vos numéros de carte.

## Durée de conservation
${TODO}

## Cookies
Le site utilise uniquement des cookies nécessaires (connexion, panier, paiement). Aucun traceur publicitaire n'est déposé sans votre accord.

## Vos droits
Accès, rectification, suppression, opposition : écrivez à ${TODO}. Vous pouvez saisir la CNIL (cnil.fr).`,
  },
  {
    slug: "livraison",
    title: "Politique de livraison",
    content: `## Zones et transporteurs
${TODO}

## Frais et délais
Les modes de livraison disponibles, leurs tarifs et le seuil de livraison offerte sont affichés au moment de la commande. Les délais indiqués sont ceux annoncés par le transporteur. ${TODO}

## Suivi
Un e-mail avec le numéro de suivi est envoyé dès l'expédition. Vous pouvez aussi suivre votre commande sur la page [Suivi de commande](/suivi).`,
  },
  {
    slug: "retours",
    title: "Retours et remboursements",
    content: `## Délai
Vous disposez de 14 jours après réception pour retourner un article non personnalisé, neuf, non porté, avec ses étiquettes.

## Articles floqués
Les maillots personnalisés (nom/numéro) ne peuvent être ni repris ni échangés, sauf défaut.

## Procédure
Faites votre demande depuis votre espace client ou via le [formulaire de contact](/contact) en indiquant votre numéro de commande. ${TODO} (adresse de retour, frais de retour)

## Remboursement
Le remboursement est effectué sur le moyen de paiement utilisé, sous 14 jours après réception et contrôle du retour.`,
  },
  {
    slug: "a-propos",
    title: "À propos",
    content: `## Notre histoire
${TODO} Racontez ici l'histoire de votre boutique, d'où viennent vos maillots et ce qui vous distingue.`,
  },
  {
    slug: "faq",
    title: "Questions fréquentes",
    content: `## Comment choisir ma taille ?
Consultez notre [guide des tailles](/guide-des-tailles). En cas de doute entre deux tailles, prenez la plus grande.

## Puis-je faire floquer mon maillot ?
Oui, lorsque l'option est indiquée sur la fiche produit. Saisissez le nom et le numéro, ou choisissez un joueur proposé. Le supplément est ajouté automatiquement.

## L'aperçu du flocage est-il exact ?
L'aperçu est une simulation pour vérifier le texte. La police et le placement finaux suivent le style officiel du maillot.

## Quels moyens de paiement acceptez-vous ?
Carte bancaire, Apple Pay et Google Pay (selon votre appareil), via Stripe.

## Dois-je créer un compte ?
Non, vous pouvez commander en tant qu'invité. Un compte permet de retrouver vos commandes et adresses.

## Comment suivre ma commande ?
Avec votre numéro de commande et votre e-mail sur la page [Suivi](/suivi).

## Délais de livraison
${TODO}`,
  },
  {
    slug: "guide-des-tailles",
    title: "Guide des tailles",
    content: `Mesures indicatives du maillot à plat. ${TODO} Vérifiez-les avec vos fournisseurs.

## Adultes
- **S** : tour de poitrine 88–96 cm
- **M** : 96–104 cm
- **L** : 104–112 cm
- **XL** : 112–124 cm
- **XXL** : 124–136 cm
- **3XL** : 136–148 cm

## Enfants
- **6 ans** : 111–116 cm de hauteur
- **8 ans** : 123–128 cm
- **10 ans** : 135–140 cm
- **12 ans** : 147–152 cm
- **14 ans** : 159–164 cm

## Conseil
Les coupes "player" sont plus ajustées que les coupes "fan" : prenez une taille au-dessus si vous préférez un maillot ample.`,
  },
];

async function main() {
  await prisma.shopSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  for (const c of categories) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  for (const p of pages) await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: p });

  if ((await prisma.shippingMethod.count()) === 0) {
    await prisma.shippingMethod.createMany({
      data: [
        { name: "Livraison à domicile", description: "Colis suivi remis en main propre ou en boîte aux lettres.", type: "HOME", price: 490, freeOver: 7000, sortOrder: 1 },
        { name: "Point relais", description: "À activer quand votre transporteur point relais est configuré.", type: "RELAY", price: 390, freeOver: 7000, sortOrder: 2, isActive: false },
      ],
    });
  }
  if ((await prisma.autoDiscount.count()) === 0) {
    await prisma.autoDiscount.create({ data: { name: "Offre 2 maillots", minQuantity: 2, percentOff: 10, isActive: false } });
  }
  console.log("✓ Données de base en place (paramètres, catégories, livraison, pages).");
}

main().finally(() => prisma.$disconnect());
