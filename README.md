# Landscape AI Studio

V0.4 - studio IA pour projets paysagers de villa.

## Fonctionnalites

- Projets paysagers avec photos Supabase Storage.
- Analyse IA photo par photo puis synthese globale.
- SWOT operationnel pour architecte paysagiste.
- 3 idees differenciees: intervention legere, moyenne, forte.
- Selection d'une idee qui oriente benchmark et plan.
- Benchmark Pinterest-first:
  1. Pinterest officiel si `PINTEREST_ACCESS_TOKEN` existe.
  2. SerpApi Google Images cible Pinterest si `SERPAPI_API_KEY` existe.
  3. Bing Image Search cible Pinterest si `BING_SEARCH_API_KEY` existe.
  4. Fallback moodboard propre sans image cassee.
- Plan masse / DWG exporte en image ou PDF.
- Zones rectangulaires liees aux photos, idee selectionnee, images/propositions et instructions texture.
- Route `/api/projects/[id]/plan-texture` pour habillage zone par zone.
- Page `/projects/[id]/report` imprimable / export PDF.

## Variables d'environnement

Obligatoires:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Optionnelles V0.4:

```bash
PINTEREST_ACCESS_TOKEN=
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
SERPAPI_API_KEY=
BING_SEARCH_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
```

Les variables Pinterest/SerpApi/Bing ne sont jamais obligatoires. Si elles manquent, le benchmark affiche des placeholders moodboard.

## Supabase

Executer `supabase/schema.sql`.

Buckets publics utilises:

- `site-images`
- `master-plans`

Tables principales V0.4:

- `projects`
- `site_images`
- `analyses`
- `swots`
- `ideas`
- `benchmark_queries`
- `benchmark_results`
- `saved_references`
- `master_plans`
- `plan_zones`
- `generated_space_images`
- `plans`

## Build

```bash
npm run build
```

Le projet est une application Next.js App Router + TypeScript + Tailwind.
