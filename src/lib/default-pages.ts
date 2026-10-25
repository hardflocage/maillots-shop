/**
 * Textes par défaut des pages éditables. Les balises {{...}} sont remplacées à l'affichage
 * par les informations saisies dans Administration > Paramètres (voir src/lib/content.ts) :
 * une ligne dont une balise n'est pas renseignée n'est pas affichée, plutôt que d'afficher
 * un texte provisoire.
 */
export const DEFAULT_PAGES: { slug: string; title: string; content: string }[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    content: `## Éditeur du site
- Nom commercial : {{boutique}}
- Raison sociale : {{raison_sociale}}
- Forme juridique : {{forme_juridique}}
- Siège social : {{adresse_siege}}
- SIRET : {{siret}}
- N° TVA intracommunautaire : {{tva}}
- Directeur de la publication : {{directeur_publication}}
- E-mail : {{email}}
- Téléphone : {{telephone}}

## Hébergement
- {{hebergeur}}

## Propriété intellectuelle
Les textes, photos et éléments graphiques de ce site sont protégés. Toute reproduction sans autorisation écrite est interdite. Les noms et logos des clubs et équipementiers appartiennent à leurs propriétaires respectifs.`,
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    content: `## 1. Objet
Les présentes conditions régissent les ventes conclues sur le site {{boutique}}, édité par {{raison_sociale}}, entre le vendeur et tout client non professionnel.

## 2. Produits
Les caractéristiques des maillots (club, saison, type, tailles disponibles) sont présentées sur chaque fiche produit, avec les photos des articles vendus. Le flocage personnalisé est réalisé selon le nom et le numéro saisis par le client, qui en vérifie l'orthographe avant paiement.

## 3. Prix
Les prix sont indiqués en euros toutes taxes comprises. Les frais de livraison sont affichés avant la validation de la commande.

## 4. Commande et paiement
La commande est définitive après confirmation du paiement par notre prestataire Stripe. Les données bancaires sont traitées directement par Stripe et ne sont jamais conservées par le vendeur. Un e-mail de confirmation récapitule la commande.

## 5. Livraison
Les modes, tarifs et zones de livraison sont détaillés dans la [politique de livraison](/pages/livraison).

## 6. Droit de rétractation
Le client dispose de 14 jours à compter de la réception pour exercer son droit de rétractation, sans avoir à se justifier. {{boutique}} accorde un délai de retour de {{delai_retour}} jours. **Conformément à l'article L221-28 du Code de la consommation, ce droit ne s'applique pas aux articles personnalisés (flocage nom/numéro).** La procédure est décrite dans la [politique de retour](/pages/retours).

## 7. Garanties légales
Les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil). Pour toute réclamation : {{email}}.

## 8. Médiation
En cas de litige non résolu, le client peut recourir gratuitement au médiateur de la consommation : {{mediateur}}.

## 9. Droit applicable
Les présentes conditions sont soumises au droit français.`,
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    content: `## Responsable du traitement
- {{raison_sociale}}, {{adresse_siege}}
- Contact : {{email}}

## Données collectées
- Commande : nom, adresse, e-mail, téléphone, nécessaires à l'exécution du contrat et à la livraison.
- Compte client facultatif : e-mail, mot de passe chiffré, adresses enregistrées.
- Newsletter : e-mail, uniquement avec votre consentement explicite.
- Paiement : traité directement par Stripe. Nous ne recevons ni ne stockons vos numéros de carte.

## Durée de conservation
Les données de commande sont conservées pendant la durée légale de conservation des documents comptables (10 ans). Les données de compte sont supprimées sur simple demande. Les inscriptions à la newsletter sont conservées jusqu'à désinscription.

## Cookies
Le site utilise uniquement des cookies nécessaires à son fonctionnement (connexion, panier, paiement). Aucun traceur publicitaire n'est déposé sans votre accord.

## Vos droits
Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition. Écrivez-nous à {{email}}. Vous pouvez également saisir la CNIL (cnil.fr).`,
  },
  {
    slug: "livraison",
    title: "Politique de livraison",
    content: `## Modes de livraison et tarifs
{{livraison}}

Les frais exacts sont toujours affichés dans le panier avant le paiement.

## Préparation et suivi
Chaque commande est préparée après confirmation du paiement. Les maillots floqués demandent un délai de préparation supplémentaire pour la personnalisation. Un e-mail avec le numéro de suivi vous est envoyé dès l'expédition, et vous pouvez suivre votre commande sur la page [Suivi de commande](/suivi).

## Un problème avec votre colis ?
Contactez-nous via le [formulaire de contact](/contact) en indiquant votre numéro de commande.`,
  },
  {
    slug: "retours",
    title: "Retours et remboursements",
    content: `## Délai
Vous disposez de {{delai_retour}} jours après réception pour retourner un article non personnalisé, neuf, non porté et avec ses étiquettes.

## Articles floqués
Les maillots personnalisés (nom et numéro) ne peuvent être ni repris ni échangés, sauf défaut ou erreur de notre part.

## Procédure
Faites votre demande depuis votre espace client ou via le [formulaire de contact](/contact) en indiquant votre numéro de commande. Nous vous confirmons l'adresse de retour par e-mail.
- Adresse de retour : {{adresse_retour}}

## Remboursement
Le remboursement est effectué sur le moyen de paiement utilisé, au plus tard 14 jours après réception et contrôle du retour.`,
  },
  {
    slug: "a-propos",
    title: "À propos",
    content: `{{a_propos}}

Une question sur un maillot, une taille ou un flocage ? [Écrivez-nous](/contact).`,
  },
  {
    slug: "faq",
    title: "Questions fréquentes",
    content: `## Comment choisir ma taille ?
Consultez notre [guide des tailles](/guide-des-tailles), accessible aussi depuis chaque fiche produit. En cas de doute entre deux tailles, prenez la plus grande.

## Puis-je faire floquer mon maillot ?
Oui, lorsque l'option est indiquée sur la fiche produit. Saisissez le nom et le numéro, ou choisissez un joueur proposé. Le supplément est ajouté automatiquement au prix.

## L'aperçu du flocage est-il exact ?
L'aperçu sert à vérifier le texte saisi. La police et le placement finaux suivent le style officiel du maillot.

## Quels moyens de paiement acceptez-vous ?
Le paiement est sécurisé par Stripe. Les moyens disponibles sont affichés au moment du paiement.

## Dois-je créer un compte ?
Non, vous pouvez commander en tant qu'invité. Un compte permet de retrouver vos commandes, vos adresses et vos favoris.

## Comment suivre ma commande ?
Avec votre numéro de commande et votre e-mail sur la page [Suivi](/suivi).

## Combien coûte la livraison ?
{{livraison}}

## Puis-je retourner un article ?
Oui, sous {{delai_retour}} jours pour un article non personnalisé. Voir la [politique de retour](/pages/retours).`,
  },
  {
    slug: "guide-des-tailles",
    title: "Guide des tailles",
    content: `Mesures indicatives du tour de poitrine. Elles peuvent légèrement varier selon l'équipementier et la saison.

## Adultes
- **S** : 88 à 96 cm
- **M** : 96 à 104 cm
- **L** : 104 à 112 cm
- **XL** : 112 à 124 cm
- **XXL** : 124 à 136 cm
- **3XL** : 136 à 148 cm

## Enfants
- **6 ans** : 111 à 116 cm de hauteur
- **8 ans** : 123 à 128 cm
- **10 ans** : 135 à 140 cm
- **12 ans** : 147 à 152 cm
- **14 ans** : 159 à 164 cm

## Conseil
Les coupes « player » sont plus ajustées que les coupes « fan » : prenez une taille au-dessus si vous préférez un maillot ample.`,
  },
];
