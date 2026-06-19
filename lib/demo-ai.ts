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
  intervention_level?: string | null;
  concept_keywords?: string[] | null;
  spaces_concerned?: string[] | null;
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
    site_summary:
      `Lecture demo: jardin de villa a ${location}, avec entree, terrasse, passage et jardin piscine a reorganiser autour d'une ambiance ${style}.`,
    climate_reading:
      "Site probablement chaud et lumineux: priorite a l'ombre utile, aux sols clairs non glissants, a l'arrosage goutte-a-goutte et aux essences sobres.",
    photo_analyses: [
      {
        photo_id: "demo-1",
        photo_title: "Entree",
        probable_space: "entree de villa",
        visible_existing_elements: ["seuil mineral", "mur ou facade proche", "zone de passage"],
        visible_materials: ["dallage clair", "enduit", "bordures minerales"],
        visible_vegetation: ["vegetation basse ponctuelle", "arbustes a renforcer"],
        possible_uses: ["arrivee pietonne", "mise en scene de l'accueil", "transition vers le jardin"],
        problems: ["lecture d'entree peu hierarchisee", "ombre limitee", "manque de strate persistante"],
        opportunities: ["cadre vegetal asymetrique", "eclairage bas", "sol plus lisible"],
        recommended_interventions: ["structurer deux massifs", "ajouter jasmin ou myrte", "poser balisage lumineux chaud"]
      },
      {
        photo_id: "demo-2",
        photo_title: "Jardin piscine",
        probable_space: "jardin piscine",
        visible_existing_elements: ["zone ouverte", "surface minerale", "potentiel de repos"],
        visible_materials: ["pierre ou carrelage", "gravier possible", "enduits clairs"],
        visible_vegetation: ["sujets a conserver", "massifs a densifier"],
        possible_uses: ["repos", "repas exterieur", "circulation autour piscine"],
        problems: ["surchauffe possible des sols", "manque d'ombrage", "arrosage a rationaliser"],
        opportunities: ["pergola legere", "massifs aromatiques", "olivier focal"],
        recommended_interventions: ["creer une terrasse ombragee", "installer goutte-a-goutte", "planter lavandes et graminees"]
      },
      {
        photo_id: "demo-3",
        photo_title: "Sortie et passage",
        probable_space: "sortie / passage lateral",
        visible_existing_elements: ["couloir de circulation", "limites minerales", "liaison entre espaces"],
        visible_materials: ["sol dur", "mur lateral", "bordures"],
        visible_vegetation: ["vegetation absente ou discontinue"],
        possible_uses: ["liaison technique", "passage quotidien", "transition ombree"],
        problems: ["passage peu confortable", "effet couloir", "peu d'interet paysager"],
        opportunities: ["ruban vegetal resistant", "pas japonais", "eclairage rasant"],
        recommended_interventions: ["poser graviers stabilises", "planter teucrium ou westringia", "clarifier la sortie"]
      }
    ],
    existing_elements: ["entree", "jardin piscine", "sortie / passage", "terrasse potentielle", "masses vegetales a renforcer"],
    opportunities: ["hierarchiser les seuils", "creer une terrasse ombragee", "renforcer les masses vegetales", "rendre le passage plus confortable"],
    constraints_to_respect: ["limiter les travaux lourds", "eviter une palette gourmande en eau", "preserver les circulations existantes"],
    design_direction:
      "Composer un jardin mediterraneen clair: entree cadrée, terrasse ombragee, jardin piscine rafraichi, passage simplifie et masses vegetales sobres.",
    recommended_next_steps: ["selectionner une idee", "generer benchmark visuel", "produire plan texture", "verifier niveaux et arrosage"]
  };
}

export function demoSwot(): SwotPayload {
  return {
    strengths: [
      "Entree, terrasse et jardin piscine peuvent devenir une sequence lisible",
      "Les surfaces minerales existantes peuvent etre reutilisees partiellement",
      "La palette mediterraneenne permet un rendu qualitatif avec peu d'eau"
    ],
    weaknesses: [
      "Passages et sorties semblent peu valorises et probablement etroits",
      "Jardin piscine expose a la surchauffe si l'ombrage reste insuffisant",
      "Masses vegetales visibles trop faibles pour structurer les vues et les usages"
    ],
    opportunities: [
      "Creer une terrasse ombragee connectee au jardin piscine",
      "Transformer l'entree par un cadre vegetal et un eclairage doux",
      "Installer une trame de massifs sobres pour unifier les photos et les espaces"
    ],
    threats: [
      "Stress hydrique si les plantations ne sont pas adaptees au climat local",
      "Arrosage mal sectorise pouvant fragiliser les nouveaux massifs",
      "Inconfort thermique par manque d'ombrage autour de la piscine et des passages",
      "Vieillissement ou fissuration des materiaux existants si les reprises sont ponctuelles",
      "Contraintes d'execution dans les passages et sorties etroites"
    ]
  };
}

export function demoIdeas(): DesignIdea[] {
  return [
    {
      title: "Intervention legere - fil vegetal et passage clair",
      description:
        "Intervention douce pour clarifier l'entree, le passage et les abords de terrasse sans transformer lourdement l'existant.",
      intervention_level: "light",
      spaces_concerned: ["entree", "sortie / passage", "terrasse"],
      spatial_moves: ["nettoyer les bords", "poser un fil vegetal continu", "ajouter balisage lumineux", "requalifier les seuils"],
      concept_keywords: ["leger", "fil vegetal", "seuils", "faible chantier"],
      materials: ["gravier stabilise", "bordure acier", "paillage mineral"],
      plants: ["teucrium", "westringia", "romarin rampant", "stipa"],
      furniture: ["banc discret", "jardiniere basse"],
      lighting: ["balises basses", "spots rasants"],
      cost_level: "maitrise",
      maintenance_level: "faible",
      preserved_elements: ["sols existants reutilisables", "circulations principales", "sujets vegetaux sains"],
      transformed_elements: ["bordures", "lecture des passages", "ambiance nocturne"]
    },
    {
      title: "Intervention moyenne - terrasse ombragee et jardin piscine",
      description:
        "Creation d'une vraie piece de vie exterieure entre terrasse et jardin piscine, avec pergola legere et massifs aromatiques.",
      intervention_level: "medium",
      spaces_concerned: ["terrasse", "jardin piscine", "entree"],
      spatial_moves: ["creer une terrasse ombragee", "cadrer les vues piscine", "densifier les massifs", "relier entree et sejour exterieur"],
      concept_keywords: ["terrasse", "ombre", "piscine", "aromatiques"],
      materials: ["pierre claire", "bois thermo-traite", "gravier beige"],
      plants: ["olivier", "lavande", "romarin", "myrte", "agapanthe"],
      furniture: ["table repas", "banquette basse", "fauteuils tresses"],
      lighting: ["suspension pergola", "uplights sur olivier", "bornes chaudes"],
      cost_level: "moyen",
      maintenance_level: "faible a moyen",
      preserved_elements: ["structure generale du jardin", "acces existants", "vegetation saine"],
      transformed_elements: ["terrasse", "confort d'ombre", "relation avec piscine"]
    },
    {
      title: "Intervention forte - recomposition mediterraneenne complete",
      description:
        "Recomposition globale des sequences entree, passage, terrasse et piscine pour produire un jardin coherent et plus immersif.",
      intervention_level: "strong",
      spaces_concerned: ["entree", "sortie / passage", "terrasse", "jardin piscine", "masses vegetales"],
      spatial_moves: ["redessiner les circulations", "creer plusieurs masses vegetales", "installer un point focal", "unifier les sols"],
      concept_keywords: ["recomposition", "masses vegetales", "villa", "mediterraneen"],
      materials: ["pierre calcaire", "beton sable", "bois naturel", "galets clairs"],
      plants: ["olivier multi-tronc", "pittosporum", "laurier noble", "jasmin etoile", "graminees"],
      furniture: ["salon exterieur", "banquettes integrees", "pots monumentaux"],
      lighting: ["scenario entree", "spots arbres", "lignes LED sous banquettes"],
      cost_level: "eleve",
      maintenance_level: "moyen",
      preserved_elements: ["volumes de villa", "arbres ou sujets remarquables", "vues principales"],
      transformed_elements: ["plan de circulation", "sols", "masses vegetales", "ambiance globale"]
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
        title: "Moodboard terrasse ombragee",
        image_url: null,
        image_query: `terrasse ombragee villa mediterraneenne pierre claire pergola ${ideaTitle}`,
        justification: "Reference de langage pour l'ombre, la pierre claire et l'ambiance repas exterieure.",
        score: 92
      },
      {
        title: "Moodboard jardin piscine sec",
        image_url: null,
        image_query: `jardin piscine mediterraneen sec olivier lavande graminees ${project.location || ""}`,
        justification: "Tres pertinent pour relier piscine, vegetaux sobres et confort climatique.",
        score: 88
      },
      {
        title: "Moodboard entree et passage plantes",
        image_url: null,
        image_query: "entree villa mediterraneenne passage vegetal eclairage bas",
        justification: "Inspiration utile pour transformer les seuils et passages en sequence paysagere.",
        score: 84
      }
    ]
  };
}

export function demoPlan(project: ProjectLike, selectedIdea?: IdeaLike | null): PlanPayload {
  const ideaTitle = selectedIdea?.title || "jardin mediterraneen de villa";

  return {
    plan_title: `Plan texture conceptuel - ${ideaTitle}`,
    concept_svg: buildConceptSvg(ideaTitle, selectedIdea?.intervention_level || "medium"),
    realistic_image_prompt:
      `Vue aerienne realiste d'un jardin de villa mediterraneen a ${project.location || "Casablanca"}, basee sur l'idee "${ideaTitle}". Montrer clairement l'entree, un passage de sortie lateral, une terrasse en pierre claire, un jardin piscine ombrage, des masses vegetales de lavande, romarin, myrte, graminees et oliviers. Materiaux naturels, teintes sable et vert olive, mobilier exterieur sobre, eclairage chaud discret, rendu architectural photorealiste, lisible pour un client, sans texte incruste.`,
    zones: ["entree", "sortie / passage", "terrasse", "jardin piscine", "masses vegetales"],
    materials: ["pierre claire terrasse", "gravier stabilise passage", "bois pergola", "paillage mineral"],
    planting: ["olivier", "lavande", "romarin", "stipa", "myrte", "jasmin etoile"],
    material_legend: ["beige: pierre claire", "ocre: gravier stabilise", "brun: bois/pergola", "gris: passage technique"],
    planting_legend: ["vert fonce: masses arbustives", "vert olive: oliviers", "violet: aromatiques fleuries"],
    validation_notes: ["Schéma conceptuel, non métrique", "verifier niveaux et pentes", "adapter l'arrosage par zone", "confirmer dimensions sur plan releve"],
    non_metric_warning: "Schéma conceptuel, non métrique"
  };
}

export function buildConceptSvg(title: string, level = "medium") {
  const isStrong = level === "strong";
  const terraceWidth = isStrong ? 270 : 220;
  const poolWidth = isStrong ? 260 : 220;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 620" role="img" aria-label="${escapeXml(title)}">
  <rect width="920" height="620" fill="#f5f1e8"/>
  <text x="40" y="42" font-family="Arial" font-size="24" font-weight="700" fill="#214331">${escapeXml(title)}</text>
  <text x="40" y="68" font-family="Arial" font-size="15" fill="#8a5a00">Schéma conceptuel, non métrique</text>
  <rect x="60" y="105" width="170" height="90" rx="10" fill="#d9c9ad" stroke="#8f7b5f"/>
  <text x="92" y="156" font-family="Arial" font-size="20" fill="#453d32">Entrée</text>
  <rect x="270" y="105" width="${terraceWidth}" height="125" rx="12" fill="#d8c7ad" stroke="#8f7b5f"/>
  <text x="305" y="172" font-family="Arial" font-size="20" fill="#453d32">Terrasse</text>
  <rect x="590" y="120" width="${poolWidth}" height="150" rx="26" fill="#8fc6d8" stroke="#256d85" stroke-width="3"/>
  <text x="642" y="202" font-family="Arial" font-size="20" fill="#164657">Jardin piscine</text>
  <path d="M150 215 C230 275 305 315 395 350 S575 425 790 455" fill="none" stroke="#bca77f" stroke-width="46" stroke-linecap="round"/>
  <path d="M150 215 C230 275 305 315 395 350 S575 425 790 455" fill="none" stroke="#fff8e8" stroke-width="24" stroke-linecap="round"/>
  <text x="640" y="500" font-family="Arial" font-size="18" fill="#6d5948">Sortie / passage</text>
  <g fill="#73935f" opacity="0.96">
    <ellipse cx="150" cy="330" rx="105" ry="50"/>
    <ellipse cx="350" cy="470" rx="130" ry="64"/>
    <ellipse cx="665" cy="365" rx="155" ry="68"/>
    <ellipse cx="795" cy="315" rx="72" ry="42"/>
  </g>
  <g fill="#b9a7cf">
    <circle cx="110" cy="330" r="9"/><circle cx="150" cy="314" r="8"/><circle cx="205" cy="348" r="9"/>
    <circle cx="315" cy="470" r="8"/><circle cx="380" cy="450" r="9"/><circle cx="440" cy="488" r="8"/>
    <circle cx="610" cy="365" r="9"/><circle cx="680" cy="340" r="8"/><circle cx="745" cy="380" r="9"/>
  </g>
  <g fill="#657f4b" stroke="#315f43" stroke-width="3">
    <circle cx="540" cy="310" r="38"/>
    <circle cx="250" cy="250" r="30"/>
    <circle cx="805" cy="245" r="34"/>
  </g>
  <rect x="285" y="240" width="170" height="58" rx="29" fill="#8f6f4d"/>
  <text x="319" y="275" font-family="Arial" font-size="17" fill="#fff8e8">Pergola</text>
  <rect x="40" y="535" width="840" height="54" rx="8" fill="#fffefa" stroke="#ded8cc"/>
  <circle cx="70" cy="562" r="9" fill="#d8c7ad"/><text x="88" y="568" font-family="Arial" font-size="14" fill="#4f4638">pierre claire</text>
  <circle cx="220" cy="562" r="9" fill="#fff8e8" stroke="#bca77f"/><text x="238" y="568" font-family="Arial" font-size="14" fill="#4f4638">gravier stabilisé</text>
  <circle cx="410" cy="562" r="9" fill="#73935f"/><text x="428" y="568" font-family="Arial" font-size="14" fill="#4f4638">masses végétales</text>
  <circle cx="610" cy="562" r="9" fill="#b9a7cf"/><text x="628" y="568" font-family="Arial" font-size="14" fill="#4f4638">aromatiques fleuries</text>
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
    const {
      is_demo: _isDemo,
      demo_reason: _demoReason,
      selected_idea_id: _selectedIdeaId,
      concept_svg: _conceptSvg,
      realistic_image_prompt: _prompt,
      spaces_concerned: _spaces,
      spatial_moves: _moves,
      preserved_elements: _preserved,
      transformed_elements: _transformed,
      ...rest
    } = row;
    return rest;
  };

  const retryRows = Array.isArray(rows) ? rows.map(strip) : strip(rows);
  const retryQuery = supabase.from(table).insert(retryRows).select(select);
  return Array.isArray(retryRows) ? retryQuery : retryQuery.single();
}

function isMissingOptionalColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  return (
    message.includes("schema cache") ||
    message.includes("is_demo") ||
    message.includes("demo_reason") ||
    message.includes("selected_idea_id") ||
    message.includes("spaces_concerned") ||
    message.includes("spatial_moves") ||
    message.includes("preserved_elements") ||
    message.includes("transformed_elements")
  );
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;" }[char] || char));
}
