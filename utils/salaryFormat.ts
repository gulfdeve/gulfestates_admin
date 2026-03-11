/**
 * Format salary for display
 * Examples: 1550000 -> "1,550,000 AED", 1040000 -> "1,040,000 AED", 500000 -> "500,000 AED"
 * Always shows full number with commas, no "M" abbreviation
 */
export function formatSalaryForDisplay(value: string | number): string {
  if (!value) return "";
  
  // If it's already a formatted string with commas and AED, return as is
  if (typeof value === "string" && /AED/i.test(value) && /,/.test(value)) {
    return value;
  }
  
  // If it has "M" in it, convert it to full number first
  let numValue: number;
  if (typeof value === "string" && /M/i.test(value)) {
    const numPart = parseFloat(value.replace(/[^\d.]/g, ""));
    numValue = !isNaN(numPart) ? numPart * 1000000 : parseFloat(value.replace(/[^\d.]/g, ""));
  } else {
    numValue = typeof value === "string" ? parseFloat(value.replace(/[^\d.]/g, "")) : value;
  }
  
  if (isNaN(numValue)) return value.toString();
  
  // Always format with commas, no "M" abbreviation
  return `${numValue.toLocaleString("en-US")} AED`;
}

/**
 * Parse salary input
 * Handles: "1550000" -> "1550000", "1.04" -> "1040000", "1.55M" -> "1550000", "500000" -> "500000"
 */
export function parseSalaryInput(input: string): string {
  if (!input || input.trim() === "") return "";
  
  // Remove spaces, currency symbols, and commas
  const cleaned = input.replace(/[\s,AED$]/gi, "").trim();
  
  // Check if it contains 'M' or 'm' (million)
  if (/[Mm]/.test(cleaned)) {
    const numPart = parseFloat(cleaned.replace(/[Mm]/g, ""));
    if (!isNaN(numPart)) {
      return (numPart * 1000000).toString();
    }
  }
  
  // If it's a decimal number less than 1000, assume it's in millions
  const numValue = parseFloat(cleaned);
  if (!isNaN(numValue) && numValue < 1000 && numValue > 0 && cleaned.includes(".")) {
    return (numValue * 1000000).toString();
  }
  
  // Otherwise, return the cleaned number (removing all non-digits)
  return cleaned.replace(/[^\d]/g, "");
}

/**
 * Format salary for storage
 * Converts display format back to numeric string for storage
 */
export function formatSalaryForStorage(value: string): string {
  const parsed = parseSalaryInput(value);
  return parsed;
}
