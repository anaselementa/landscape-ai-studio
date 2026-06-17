import OpenAI from "openai";

function hasRealOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.startsWith("sk-") && key !== "test_key_placeholder");
}

function isDemoMode() {
  return process.env.OPENAI_DEMO_MODE === "true" || !hasRealOpenAiKey();
}

export async function generateJsonWithOpenAI<T>({
  system,
  user,
  imageUrls,
  fallback
}: {
  system: string;
  user: string;
  imageUrls?: string[];
  fallback: T;
}): Promise<{ data: T; usedDemo: boolean; error?: string }> {
  if (isDemoMode()) {
    return { data: fallback, usedDemo: true };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
    const content: any[] = [{ type: "text", text: user }];
    for (const url of imageUrls?.slice(0, 4) || []) {
      if (url) content.push({ type: "image_url", image_url: { url } });
    }

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    return { data: JSON.parse(raw) as T, usedDemo: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur OpenAI inconnue";
    // Le prototype continue de marcher meme sans quota API.
    return { data: fallback, usedDemo: true, error: message };
  }
}

export function demoAnalysis(projectName: string, style?: string | null) {
  return {
    summary: `Analyse prototype pour ${projectName}. Le site presente une base existante qualitative, avec une structure de villa deja lisible, des espaces verts a clarifier et un potentiel fort de requalification en style ${style || "mediterraneen contemporain"}.`,
    spaces_detected: [
      "jardin piscine / terrasse",
      "pelouse longitudinale",
      "entree principale",
      "passage lateral",
      "zone de facade a requalifier"
    ],
    existing_assets: [
      "architecture blanche contemporaine",
      "haies et masses vegetales deja etablies",
      "piscine existante",
      "cheminements et pelouses utilisables"
    ],
    issues: [
      "manque de coherence generale entre les espaces",
      "massifs parfois vieillissants",
      "bordures et details a moderniser",
      "palette vegetale a harmoniser"
    ],
    opportunities: [
      "creer un langage mediterraneen contemporain coherent",
      "valoriser les abords de piscine",
      "ameliorer l'entree et les sequences de passage",
      "introduire un eclairage paysager chaud"
    ],
    design_direction: "Conserver la structure existante, epurer les massifs, ameliorer les sols et introduire une palette mediterraneenne contemporaine sobre, avec lavandes, romarins, teucriums, graminees et sujets structurants."
  };
}

export function demoSwot() {
  return {
    summary: "SWOT prototype base sur les photos importees et le brief du projet.",
    strengths: [
      "Architecture existante deja forte et identifiable",
      "Piscine et pelouses existantes exploitables",
      "Intimite assuree par les haies hautes",
      "Espaces varies permettant plusieurs ambiances"
    ],
    weaknesses: [
      "Composition vegetale peu unifiee",
      "Details de sol et bordures a moderniser",
      "Certaines zones paraissent moins soignees",
      "Absence d'un fil conducteur clair entre entree, piscine et jardin lateral"
    ],
    opportunities: [
      "Installer une ambiance mediterraneenne contemporaine coherente",
      "Creer des massifs plus sobres et faciles a entretenir",
      "Valoriser la piscine par le traitement des abords",
      "Ajouter un eclairage doux pour renforcer l'effet premium"
    ],
    threats: [
      "Trop transformer pourrait denaturer l'existant",
      "Un mauvais choix vegetal augmenterait l'entretien",
      "Une pelouse trop dominante maintiendrait une consommation d'eau elevee",
      "Des rendus trop spectaculaires pourraient devenir irrealisables"
    ]
  };
}

export function demoReferences() {
  return {
    references: [
      {
        title: "Jardin mediterraneen contemporain avec piscine",
        description: "Abords de piscine en pierre claire, massifs bas aromatiques, eclairage chaud et mobilier sobre.",
        tags: ["piscine", "mediterraneen", "pierre claire", "lavande"],
        image_query: "contemporary mediterranean villa pool garden beige stone lavender olive tree",
        reason: "Reference adaptee a la zone piscine de Villa M."
      },
      {
        title: "Entree de villa blanche et bois",
        description: "Cheminement en dalles, topiaires simplifies, plantes basses et mise en lumiere de l'entree.",
        tags: ["entree", "villa", "bois", "topiaire"],
        image_query: "modern white villa entrance mediterranean landscaping wood door",
        reason: "Reference adaptee a la sequence d'arrivee."
      },
      {
        title: "Promenade-jardin laterale",
        description: "Pelouse centrale conservee, massifs lateraux structures, oliviers et graminees pour donner de la profondeur.",
        tags: ["pelouse", "promenade", "olivier", "graminees"],
        image_query: "long side garden mediterranean villa lawn olive trees ornamental grasses",
        reason: "Reference pour transformer une longue pelouse en promenade paysagere."
      }
    ]
  };
}

export function demoIdeas() {
  return {
    ideas: [
      {
        title: "Mediterraneen contemporain conservateur",
        description: "Conserver la structure existante, epurer les massifs, moderniser les bordures et enrichir la palette vegetale par des aromatiques, graminees et sujets sculpturaux.",
        intervention_level: "moyen",
        materials: ["dallage beige clair", "gravier beige", "bordures acier ou pierre"],
        plants: ["olivier", "lavande", "romarin", "teucrium", "santoline", "stipa"],
        furniture: ["pots rectangulaires", "banquette discrete", "salon exterieur sobre"],
        lighting: ["spots chauds au pied des sujets", "balises basses", "mise en valeur des murs"],
        cost_level: "moyen",
        maintenance_level: "faible a moyen"
      },
      {
        title: "Villa resort mediterraneenne",
        description: "Donner une ambiance plus luxueuse aux abords de piscine avec des plantations plus genereuses, un espace lounge et une mise en lumiere plus marquee.",
        intervention_level: "fort",
        materials: ["grandes dalles", "bois exterieur", "pierre naturelle claire"],
        plants: ["olivier multi-tronc", "chamaerops", "agapanthe", "westringia", "pennisetum"],
        furniture: ["lounge piscine", "transats", "jardinieres premium"],
        lighting: ["eclairage indirect", "uplights arbres", "lumiere chaude terrasse"],
        cost_level: "eleve",
        maintenance_level: "moyen"
      },
      {
        title: "Jardin sec elegant et sobre",
        description: "Reduire partiellement la pelouse et transformer certaines bandes en massifs secs tres graphiques pour limiter l'entretien et la consommation d'eau.",
        intervention_level: "moyen",
        materials: ["gravier mineral", "pas japonais grands formats", "paillage mineral"],
        plants: ["teucrium", "santoline", "romarin rampant", "agave attenuata", "stipa"],
        furniture: ["assises ponctuelles", "pots terre cuite sobres"],
        lighting: ["bornes basses", "spots discrets"],
        cost_level: "moyen",
        maintenance_level: "faible"
      }
    ]
  };
}
