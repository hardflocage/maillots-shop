# Checklist avant l'ouverture de la boutique

Cochez chaque point **sur le site en ligne**, en mode test Stripe d'abord, puis une fois en mode live avec un vrai petit achat que vous remboursez.

## Configuration
- [ ] Admin › Paramètres : tous les services sont « configurés » (Stripe, webhook, e-mails, stockage, tâches)
- [ ] Toutes les pages légales sont complétées (plus aucune mention [À COMPLÉTER])
- [ ] CGV et mentions légales relues par un professionnel
- [ ] Modes de livraison, tarifs et délais réels
- [ ] Produits de démonstration supprimés
- [ ] Chaque produit a une photo DEVANT et une photo DOS (la liste Produits signale les manques)
- [ ] Stocks saisis taille par taille

## Parcours client (sur téléphone ET sur ordinateur)
- [ ] Accueil, menu mobile, recherche, filtres
- [ ] Fiche produit : boutons Devant / Dos, glisser au doigt, zoom
- [ ] Taille épuisée grisée et impossible à commander
- [ ] Flocage : aperçu « simulé » sur le dos, supplément ajouté au prix
- [ ] Panier : quantités, suppression, code promo, livraison offerte au-dessus du seuil
- [ ] Commande sans compte → page Stripe → paiement `4242 4242 4242 4242` → page de confirmation « Payée »
- [ ] E-mail de confirmation reçu par le client, e-mail « nouvelle commande » reçu par vous
- [ ] Carte refusée `4000 0000 0000 0002` : aucune commande payée, message d'erreur Stripe
- [ ] Retour arrière depuis Stripe : « Paiement annulé », stock libéré
- [ ] Le stock de la taille achetée a diminué
- [ ] Apple Pay (iPhone/Safari) et Google Pay (Android/Chrome) proposés
- [ ] Création de compte, connexion, mot de passe oublié (e-mail reçu), favoris, adresses

## Gestion des commandes (admin)
- [ ] La commande apparaît dans « À traiter » avec le détail du flocage
- [ ] Passage « Expédiée » avec numéro de suivi → e-mail d'expédition reçu → page /suivi correcte
- [ ] Remboursement partiel puis total depuis l'admin → visible dans Stripe, e-mail reçu
- [ ] Création d'un code promo, d'une remise multi-maillots, d'une catégorie
- [ ] Un compte client ne peut pas ouvrir /admin

## Technique
- [ ] `npm test` et `npm run test:integration` au vert
- [ ] `npm run test:e2e` au vert sur un environnement de test
- [ ] Nom de domaine en HTTPS, `NEXT_PUBLIC_SITE_URL` correct
- [ ] Google Search Console : sitemap `https://votre-domaine/sitemap.xml` soumis
- [ ] Passage de Stripe en mode **live** (clé + webhook live) et un vrai achat test remboursé
