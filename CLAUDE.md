# Artizano — Mémo projet

## Description
Plateforme française mettant en relation des particuliers (propriétaires) et des artisans. Les particuliers publient des projets, les artisans découvrent les offres et communiquent directement avec les clients. Déployé sur **artizano.fr** (GitHub Pages).

## Stack technique
- **Frontend** : SPA en HTML/CSS/JS vanilla (pas de framework), Google Fonts (Syne + DM Sans)
- **Backend** : Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Hébergement** : GitHub Pages, domaine custom via CNAME

## Fonctionnalités réalisées
1. **Auth** — Inscription/connexion email + mot de passe, 2 rôles : `particulier` et `artisan`, création de profil automatique via trigger Supabase
2. **Projets (particulier)** — Formulaire multi-étapes (catégorie → titre/description → localisation + budget + urgence), dashboard avec suivi de statut (ouvert/en cours/terminé/annulé)
3. **Découverte projets (artisan)** — Dashboard artisan, recherche/filtre par titre ou catégorie, badges urgence
4. **Messagerie temps réel** — Supabase Realtime (INSERT events), historique par projet, UI optimiste, auto-scroll
5. **Profil artisan** — Spécialités, expérience, rayon d'intervention, tarif horaire, SIRET
6. **Avis & notes** — Système d'évaluation 1-5 étoiles lié aux projets
7. **Géolocalisation** — API navigateur + reverse-geocode BigDataCloud
8. **Page Tarifs** — Plans Starter (29€/mois) et Pro (49€/mois), toggle mensuel/annuel
9. **Politique de confidentialité** — `privacy.html`
10. **Menu responsive** — Hamburger mobile avec fermeture au clic extérieur

## Structure fichiers
```
index.html      — SPA complète (CSS ~1900 lignes + JS ~800 lignes intégrés)
privacy.html    — Page politique de confidentialité
setup.sql       — Schéma BDD Supabase complet
CNAME           — artizano.fr
```

## Base de données (Supabase)
Tables : `profiles`, `projets`, `conversations`, `messages`, `avis`
Sécurité : RLS activé, trigger auto-création profil, index sur requêtes fréquentes

## Historique git (8 commits)
1. Initial Artizano v2
2. Intégration Supabase (vraies inscriptions)
3. Corrections validation formulaire projets
4. Messagerie + profils artisans
5. Realtime, recherche, menu mobile
6. Persistance session + géolocalisation
7. Upload fichiers + configuration domaine

## État actuel
Projet **fonctionnel de bout en bout** pour les deux types d'utilisateurs. Code propre dans un fichier unique, infrastructure managée via Supabase.
