# Installation Landscape AI Studio V0.2

## Ce que cette version ajoute

- 1. Upload photos
- 2. Analyse du site
- 3. SWOT
- 4. References / benchmark textuel
- 5. Idees par espace
- 6. Selection d'une idee
- 7. Import plan masse + zones associees
- 8. Texturage 2D conceptuel
- 9. Prompt de plan realiste
- 10. Validation finale

Important : cette V0.2 ne genere pas encore une vraie image photorealiste finale de plan masse. Elle prepare l'etape suivante : generation d'images et export PDF.

## Mise a jour depuis V0.1

1. Telecharger le ZIP V0.2.
2. Dezipper.
3. Upload tout le contenu dans GitHub en remplacant les fichiers existants.
4. Commit.
5. Vercel redeploie.
6. Dans Supabase > SQL Editor, executer `supabase/schema.sql`.
7. Tester le projet Villa M.

## Variables Vercel

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- OPENAI_TEXT_MODEL
- OPENAI_DEMO_MODE

Si OPENAI_API_KEY n'a pas de quota, l'app utilise des resultats demo pour ne pas bloquer le flux.
