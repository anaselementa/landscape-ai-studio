import type { DesignIdea, LandscapeAnalysis } from "@/lib/types";

type ProjectLike = {
  name?: string | null;
  project_type?: string | null;
  location?: string | null;
  style?: string | null;
  constraints?: string | null;
};

export type DemoMeta = {
  isDemo: boolean;
  demoReason: string | null;
};

export function getOpenAIDemoReason(error: unknown): string | null {
  const status = Number((error as { status?: number })?.status || (error as { code?: number })?.code || 0);
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  if (
    status === 401 ||
    status === 429 ||
    normalized.includes("openai_api_key is missing") ||
    normalized.includes("api key") ||
    normalized.includes("invalid_api_key") ||
    normalized.includes("incorrect api key") ||
    normalized.includes("quota") ||
    normalized.includes("insufficient_quota") ||
    normalized.includes("quota exceeded") ||
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
    space_type: "Jardin mediterraneen de villa",
    objective_description:
      `Transformer le jardin en espace de vie exterieur calme, structure et compatible avec le climat de ${location}.`,
    existing_elements: [
      "Volumes de villa a valoriser par des seuils plantes",
      "Zones minerales pouvant accueillir des cheminements sobres",
      "Potentiel d'ombre a renforcer autour des lieux de repos",
      "Espaces libres adaptes a une palette vegetale mediterraneenne"
    ],
    landscape_diagnosis:
      "Le site peut gagner en confort et en coherence par une trame simple: circulation lisible, plantations sobres, zones d'ombre et materiaux naturels.",
    elements_to_keep: [
      "Les sujets vegetaux sains deja presents",
      "Les axes de circulation existants s'ils sont fonctionnels",
      "Les vues ouvertes depuis les pieces principales",
      "Les surfaces minerales reutilisables"
    ],
    elements_to_improve: [
      "Ajouter une strate arbustive persistante pour cadrer les vues",
      "Renforcer l'ombrage des zones de sejour",
      "Limiter les surfaces tres arrosees",
      "Clarifier les transitions entre terrasse, jardin et acces"
    ],
    swot: demoSwot(),
    design_direction:
      `Un jardin ${style}, sobre et chaleureux, associant pierre claire, gravier stabilise, olivier, romarin, lavande, graminees et eclairage bas.`
  };
}

export function demoSwot() {
  return {
    strengths: [
      "Cadre de villa favorable a des espaces exterieurs qualitatifs",
      "Palette mediterraneenne robuste et peu consommatrice en eau",
      "Possibilite de creer des ambiances differenciees sans travaux lourds"
    ],
    weaknesses: [
      "Confort d'ete probablement limite sans ombrage renforce",
      "Risque de surfaces minerales trop chaudes",
      "Manque possible de hierarchie entre acces, terrasse et jardin"
    ],
    opportunities: [
      "Creer une terrasse ombragee comme piece de vie exterieure",
      "Introduire des plantes aromatiques et persistantes adaptees au climat",
      "Mettre en valeur la villa par un eclairage discret et rasant"
    ],
    threats: [
      "Stress hydrique si la palette vegetale est trop gourmande en eau",
      "Entretien eleve si les massifs ne sont pas simplifies",
      "Inconfort thermique si les zones de repos restent exposees"
    ]
  };
}

export function demoIdeas(): DesignIdea[] {
  return [
    {
      title: "Terrasse ombragee mediterraneenne",
      description:
        "Creer une zone de sejour avec pergola legere, sol en pierre claire et massifs aromatiques en bordure pour filtrer les vues sans fermer l'espace.",
      intervention_level: "medium",
      materials: ["pierre calcaire claire", "bois thermo-traite", "gravier stabilise"],
      plants: ["olivier", "romarin", "lavande", "teucrium"],
      furniture: ["banquette basse", "table exterieure", "fauteuils tresses"],
      lighting: ["bornes basses", "spots rasant les troncs", "ruban chaud sous assise"],
      cost_level: "moyen",
      maintenance_level: "faible a moyen"
    },
    {
      title: "Cheminement sensoriel sobre",
      description:
        "Structurer le jardin par un chemin en pas japonais et graviers, accompagne de graminees et plantes parfumees pour guider naturellement la promenade.",
      intervention_level: "light",
      materials: ["pas japonais", "gravier beige", "bordures acier brut"],
      plants: ["stipa", "sauge", "pittosporum nain", "agapanthe"],
      furniture: ["banc mineral ponctuel"],
      lighting: ["balises solaires chaudes", "spots encastres discrets"],
      cost_level: "maitrise",
      maintenance_level: "faible"
    },
    {
      title: "Cadre vegetal pour entree de villa",
      description:
        "Recomposer l'arrivee avec deux masses vegetales asymetriques, une strate persistante et un eclairage doux pour donner une lecture plus elegante de l'entree.",
      intervention_level: "medium",
      materials: ["enduit mineral", "galets clairs", "paillage mineral"],
      plants: ["laurier noble", "myrte", "westringia", "jasmin etoile"],
      furniture: ["jardiniere basse integree"],
      lighting: ["appliques chaudes", "uplights sur sujets structurants"],
      cost_level: "moyen",
      maintenance_level: "faible"
    }
  ];
}

export function demoReferences(project: ProjectLike) {
  return {
    summary: `Benchmark demo pour un jardin de villa ${project.style || "mediterraneen contemporain"}.`,
    references: [
      {
        title: "Patio mediterraneen mineral et plante",
        region: "Maroc / bassin mediterraneen",
        why_relevant: "Combine ombre, mineral clair et vegetation sobre adaptee aux periodes chaudes.",
        materials: ["pierre claire", "enduit chaux", "gravier stabilise"],
        planting_palette: ["olivier", "romarin", "lavande", "myrte"],
        design_lessons: ["privilegier l'ombre utile", "limiter les pelouses", "travailler les seuils"]
      },
      {
        title: "Jardin sec contemporain de villa",
        region: "Espagne du sud",
        why_relevant: "Reference pertinente pour une ambiance elegante avec peu d'arrosage.",
        materials: ["beton sable", "acier brut", "galets clairs"],
        planting_palette: ["agave", "stipa", "teucrium", "pittosporum"],
        design_lessons: ["contraster masses vegetales et vides", "eclairer bas", "simplifier les circulations"]
      },
      {
        title: "Terrasse ombree avec palette aromatique",
        region: "Riviera mediterraneenne",
        why_relevant: "Inspire un espace de vie exterieur confortable et facile a entretenir.",
        materials: ["bois", "terre cuite", "pierre naturelle"],
        planting_palette: ["sauge", "jasmin", "agapanthe", "laurier"],
        design_lessons: ["creer une piece exterieure", "filtrer les vues", "parfumer les abords"]
      }
    ]
  };
}

export function demoPlan(project: ProjectLike) {
  const style = project.style || "mediterraneen contemporain";

  return {
    plan_title: "Plan texturé demo - jardin de villa mediterraneen",
    textured_plan_prompt:
      `Plan masse realiste en vue du dessus pour un jardin de villa ${style}: terrasse claire attenante a la maison, cheminements en gravier stabilise, massifs mediterraneens avec oliviers, lavandes, romarins, graminees, zone repas ombragee par pergola, eclairage chaud discret, rendu architectural propre, textures naturelles, proportions lisibles.`,
    zones: [
      "Terrasse principale ombragee",
      "Cheminement mineral drainant",
      "Massifs mediterraneens bas",
      "Point focal avec olivier",
      "Espace repas exterieur"
    ],
    materials: ["pierre claire", "gravier stabilise", "bois naturel", "paillage mineral"],
    planting: ["olivier", "romarin", "lavande", "stipa", "myrte"],
    validation_notes: [
      "Verifier les niveaux et les pentes avant execution",
      "Adapter les essences a l'exposition reelle",
      "Prevoir une irrigation goutte-a-goutte sectorisee"
    ]
  };
}

export async function insertWithOptionalDemoColumns(
  supabase: any,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  select = "id"
) {
  const query = supabase.from(table).insert(rows).select(select);
  const result = Array.isArray(rows) ? await query : await query.single();

  if (!result.error || !isMissingDemoColumnError(result.error)) {
    return result;
  }

  const strip = (row: Record<string, unknown>) => {
    const { is_demo: _isDemo, demo_reason: _demoReason, ...rest } = row;
    return rest;
  };

  const retryRows = Array.isArray(rows) ? rows.map(strip) : strip(rows);
  const retryQuery = supabase.from(table).insert(retryRows).select(select);
  return Array.isArray(retryRows) ? retryQuery : retryQuery.single();
}

function isMissingDemoColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  return message.includes("is_demo") || message.includes("demo_reason") || message.includes("schema cache");
}
