export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export function safeDate(value: string | null | undefined) {
  if (!value) return "Date inconnue";
  try {
    return new Date(value).toLocaleDateString("fr-FR");
  } catch {
    return value;
  }
}

export function safeJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}
