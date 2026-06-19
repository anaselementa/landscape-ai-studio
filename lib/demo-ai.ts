import type { BenchmarkPayload, DesignIdea, LandscapeAnalysis, PlanPayload, SwotPayload } from "@/lib/types";

type ProjectLike = {
  name?: string | null;
  project_type?: string | null;
  location?: string | null;
  style?: string | null;
  constraints?: string | null;
};

type IdeaLike = {
  title?: string | null;
  description?: string | null;
  concept_keywords?: string[] | null;
};

export function getOpenAIDemoReason(error: unknown): string | null {
  const status = Number((error as { status?: number })?.status || (error as { code?: number })?.code || 0);
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  if (
    status === 401 ||
    status === 429 ||
    normalized.includes("openai_api_key") ||
    normalized.includes("api key") ||
    normalized.includes("invalid_api_key") ||
    normalized.includes("incorrect api key") ||
    normalized.includes("quota") ||
    normalized.includes("insufficient_quota") ||
    normalized.includes("exceeded your current quota")
  ) {
    return status ? `OpenAI ${status}: ${message}` : message;
  }

  return null;
}

export function demoAnalysis(project: ProjectLike): LandscapeAnalysis {
  const location = project.location || "Casablanca";
  const style = project.style || "mediterraneen contemporain";

  return {
    site_summary: `Jardin de villa a ${location}, avec un potentiel fort pour un amenagement ${style} sobre et chaleureux.`,
    climate_reading: "Climat chaud et lumineux: priorite a l'ombre, aux sols clairs, au goutte-a-goutte et aux essences sobres en eau.",
    existing_elements: ["volumes de villa a cadrer", "zones minerales reutilisables", "espaces libres pour massifs bas", "axes a clarifier"],
    opportunities: ["creer une terrasse ombragee", "renforcer les seuils plantes", "valoriser un sujet focal", "installer un eclairage bas"],
    constraints_to_respect: ["limiter les travaux lourds", "eviter une palette trop gourmande en eau", "preserver les vues utiles"],
    design_direction: "Composer une trame claire: terrasse, cheminement mineral, massifs mediterraneens, point focal vegetal et lumiere chaude.",
    recommended_next_steps: ["valider l'idee directrice", "choisir une palette vegetale", "generer le benchmark", "produire un plan texture"]
  };
}

export function demoSwot(): SwotPayload {
  return {
    strengths: ["cadre de villa valorisable", "palette mediterraneenne robuste", "potentiel d'ombrage et de pieces exterieures"],
    weaknesses: ["lecture des circulations a clarifier", "risque de surchauffe minerale", "manque possible de strate arbustive"],
    opportunities: ["creer un jardin sec elegant", "mettre en scene l'entree", "ajouter une terrasse repas ombragee"],
    threats: ["stress hydrique", "entretien excessif si palette mal choisie", "confort d'ete faible sans ombre"]
  };
}

export function demoIdeas(): DesignIdea[] {
  return [
    {
      title: "Patio ombrage et massifs aromatiques",
      description: "Une terrasse claire avec pergola legere, bordee de lavandes, romarins et graminees pour creer une piece exterieure fraiche.",
      intervention_level: "medium",
      concept_keywords: ["patio", "ombre", "aromatiques", "pierre claire"],
      materials: ["pierre calcaire", "bois thermo-traite", "gravier stabilise"],
      plants: ["olivier", "romarin", "lavande", "stipa"],
      furniture: ["table repas", "banquette basse", "fauteuils tresses"],
      lighting: ["bornes basses", "uplights sur olivier", "ligne chaude sous pergola"],
      cost_level: "moyen",
      maintenance_level: "faible a moyen"
    },
    {
      title: "Jardin sec graphique",
      description: "Une composition plus contemporaine avec masses vegetales sobres, vides mineraux et cheminements tres lisibles.",
      intervention_level: "light",
      concept_keywords: ["jardin sec", "graphique", "gravier", "faible eau"],
      materials: ["gravier beige", "bordures acier", "pas japonais"],
      plants: ["teucrium", "pittosporum nain", "agave", "sauge"],
      furniture: ["banc mineral"],
      lighting: ["spots encastres", "balises discretes"],
      cost_level: "maitrise",
      maintenance_level: "faible"
    },
    {
      title: "Entree de villa cadre vegetal",
      description: "Une arrivee plus elegante avec deux masses arbustives asymetriques, un sol clair et un eclairage doux.",
      intervention_level: "medium",
      concept_keywords: ["entree", "cadre vegetal", "eclairage", "villa"],
      materials: ["enduit mineral", "galets clairs", "paillage mineral"],
      plants: ["myrte", "laurier noble", "jasmin etoile", "westringia"],
      furniture: ["jardiniere basse integree"],
      lighting: ["appliques chaudes", "spots rasants"],
      cost_level: "moyen",
      maintenance_level: "faible"
    }
  ];
}

export function demoBenchmark(project: ProjectLike, selectedIdea?: IdeaLike | null): BenchmarkPayload {
  const ideaTitle = selectedIdea?.title || "direction mediterraneenne";

  return {
    summary: `Benchmark visuel demo oriente par l'idee selectionnee: ${ideaTitle}.`,
    selected_idea_title: selectedIdea?.title || undefined,
    references: [
      {
        title: "Patio mediterraneen mineral",
        image_url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&w=900&q=80",
        image_query: `mediterranean villa patio stone pergola ${ideaTitle}`,
        justification: "Reference utile pour l'ombrage, les sols clairs et une ambiance de villa sobre.",
        score: 92
      },
      {
        title: "Jardin sec contemporain",
        image_url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80",
        image_query: `dry mediterranean garden gravel olive modern villa ${project.location || ""}`,
        justification: "Tres coherent pour limiter l'eau et garder un dessin graphique.",
        score: 88
      },
      {
        title: "Terrasse aromatique ombragee",
        image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
        image_query: "shaded outdoor dining mediterranean villa aromatic plants",
        justification: "Inspiration directe pour une piece exterieure conviviale et facile a entretenir.",
        score: 84
      }
    ]
  };
}

export function demoPlan(project: ProjectLike, selectedIdea?: IdeaLike | null): PlanPayload {
  const ideaTitle = selectedIdea?.title || "jardin mediterraneen de villa";
  const svg = buildConceptSvg(ideaTitle);

  return {
    plan_title: `Plan texture conceptuel - ${ideaTitle}`,
    concept_svg: svg,
    realistic_image_prompt:
      `Rendu realiste en vue aerienne d'un ${ideaTitle} pour villa ${project.style || "mediterraneenne"}: terrasse en pierre claire, cheminement en gravier stabilise, massifs de lavande, romarin, stipa et olivier, pergola legere, mobilier sobre, eclairage chaud discret, textures naturelles, proportions architecturales lisibles.`,
    zones: ["terrasse ombragee", "cheminement mineral", "massifs mediterraneens", "olivier focal", "espace repas"],
    materials: ["pierre claire", "gravier stabilise", "bois naturel", "paillage mineral"],
    planting: ["olivier", "romarin", "lavande", "stipa", "myrte"],
    validation_notes: ["verifier les niveaux", "adapter les plantations a l'exposition", "prevoir goutte-a-goutte sectorise"]
  };
}

export function buildConceptSvg(title: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" role="img" aria-label="${escapeXml(title)}">
  <rect width="900" height="560" fill="#f5f1e8"/>
  <rect x="60" y="70" width="300" height="135" rx="10" fill="#d8c7ad"/>
  <text x="86" y="145" font-family="Arial" font-size="24" fill="#4f4638">Terrasse pierre claire</text>
  <path d="M370 150 C500 180 575 255 730 265" fill="none" stroke="#b7a17c" stroke-width="34" stroke-linecap="round"/>
  <path d="M370 150 C500 180 575 255 730 265" fill="none" stroke="#fff8e8" stroke-width="20" stroke-linecap="round"/>
  <circle cx="710" cy="255" r="70" fill="#a9b879"/>
  <circle cx="710" cy="255" r="36" fill="#6f8756"/>
  <text x="650" y="355" font-family="Arial" font-size="20" fill="#315f43">Olivier focal</text>
  <g fill="#7f9a64">
    <ellipse cx="155" cy="335" rx="92" ry="45"/>
    <ellipse cx="330" cy="385" rx="115" ry="55"/>
    <ellipse cx="575" cy="420" rx="130" ry="62"/>
  </g>
  <g fill="#b9a7cf">
    <circle cx="115" cy="330" r="9"/><circle cx="155" cy="318" r="8"/><circle cx="198" cy="340" r="9"/>
    <circle cx="285" cy="382" r="8"/><circle cx="355" cy="365" r="9"/><circle cx="410" cy="395" r="8"/>
    <circle cx="535" cy="420" r="9"/><circle cx="610" cy="397" r="8"/><circle cx="680" cy="430" r="9"/>
  </g>
  <rect x="95" y="225" width="190" height="65" rx="32" fill="#8f6f4d"/>
  <text x="118" y="265" font-family="Arial" font-size="19" fill="#fff8e8">Pergola repas</text>
  <text x="96" y="487" font-family="Arial" font-size="22" fill="#4f4638">${escapeXml(title)}</text>
</svg>`;
}

export async function insertWithOptionalDemoColumns(
  supabase: any,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  select = "id"
) {
  const query = supabase.from(table).insert(rows).select(select);
  const result = Array.isArray(rows) ? await query : await query.single();

  if (!result.error || !isMissingOptionalColumnError(result.error)) {
    return result;
  }

  const strip = (row: Record<string, unknown>) => {
    const { is_demo: _isDemo, demo_reason: _demoReason, selected_idea_id: _selectedIdeaId, concept_svg: _conceptSvg, realistic_image_prompt: _prompt, ...rest } = row;
    return rest;
  };

  const retryRows = Array.isArray(rows) ? rows.map(strip) : strip(rows);
  const retryQuery = supabase.from(table).insert(retryRows).select(select);
  return Array.isArray(retryRows) ? retryQuery : retryQuery.single();
}

function isMissingOptionalColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  return message.includes("schema cache") || message.includes("is_demo") || message.includes("demo_reason") || message.includes("selected_idea_id");
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;" }[char] || char));
}
