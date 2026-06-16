# Landscape AI Studio — Prototype V0.1

Prototype de départ pour une application IA d’architecture de paysage.

## Ce que cette V0.1 fait

- Créer un projet paysager.
- Importer plusieurs photos du site.
- Afficher les photos.
- Analyser une photo avec l’IA.
- Générer un SWOT.
- Générer 3 idées d’aménagement.
- Sauvegarder les données dans Supabase.

## Ce que cette V0.1 ne fait pas encore

- Générer des rendus réalistes.
- Générer un PDF client.
- Habiller automatiquement le plan masse.
- Gérer des comptes utilisateurs sécurisés.

Ces fonctions viendront en V0.2, V0.3 et V0.4.

## Installation locale

### 1. Installer Node.js

Installer Node.js LTS depuis le site officiel.

### 2. Installer les dépendances

Dans le dossier du projet :

```bash
npm install
```

### 3. Créer le fichier `.env.local`

Copier `.env.example` et le renommer `.env.local`.

Remplir les valeurs :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

### 4. Créer les tables Supabase

Dans Supabase :

- ouvrir le projet Supabase ;
- aller dans SQL Editor ;
- copier le contenu de `supabase/schema.sql` ;
- exécuter le script.

### 5. Lancer l’application

```bash
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

## Test recommandé avec Villa M

Créer un projet :

- Nom : Villa M
- Type : Réaménagement de jardin ancien de villa
- Localisation : Casablanca
- Style : Méditerranéen contemporain
- Contraintes : Ne pas dénaturer l’existant complètement

Importer les photos du site, puis lancer l’analyse IA sur une image.

## Sécurité

Cette V0.1 est volontairement simplifiée pour tester l’idée. Elle utilise un bucket public pour les images. Pour une vraie application client, il faudra :

- ajouter l’authentification ;
- rendre les buckets privés ;
- utiliser des URLs signées ;
- ajouter Row Level Security ;
- ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.

## Prochaines versions

V0.2 : génération d’images de rendu réalistes.  
V0.3 : export PDF client simple.  
V0.4 : import plan masse + zones.  
V0.5 : habillage semi-automatique du plan.
