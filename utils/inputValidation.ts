export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false; // RFC 5321 limit
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[<>'"&]/g, "") // Remove dangerous characters
    .trim()
    .substring(0, maxLength);
};

export const sanitizeTextarea = (input: string, maxLength: number = 10000): string => {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[<>'"&]/g, "") // Remove dangerous characters
    .trim()
    .substring(0, maxLength);
};

export const validateAndSanitizeTitle = (title: string, maxLength: number = 200): string | null => {
  if (!title || typeof title !== "string") return null;
  const sanitized = sanitizeInput(title, maxLength);
  return sanitized.length > 0 ? sanitized : null;
};