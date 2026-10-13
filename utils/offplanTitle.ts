/** Resolve a display title from API / mongorestore shapes (string, title.en, languages.title.*). */
export function getOffplanDisplayTitle(
  offplan: Record<string, unknown>,
  preferLocale: "en" | "es" | "fr" = "en"
): string {
  const title = offplan.title;
  if (typeof title === "string" && title.trim()) return title.trim();

  const pickFromMap = (map: unknown): string => {
    if (!map || typeof map !== "object") return "";
    const obj = map as Record<string, unknown>;
    const order =
      preferLocale === "en"
        ? (["en", "es", "fr"] as const)
        : preferLocale === "es"
          ? (["es", "en", "fr"] as const)
          : (["fr", "en", "es"] as const);
    for (const key of order) {
      const v = obj[key];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  const languages = offplan.languages as Record<string, unknown> | undefined;
  return (
    pickFromMap(languages?.title) ||
    pickFromMap(typeof title === "object" ? title : null)
  );
}
