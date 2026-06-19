export function safeDate(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("fr-FR");
}

export function selectedIdeaSummary(idea?: { title?: string | null; description?: string | null } | null) {
  if (!idea) {
    return "Aucune idee selectionnee";
  }

  return `${idea.title || "Idee selectionnee"} - ${idea.description || ""}`.trim();
}
