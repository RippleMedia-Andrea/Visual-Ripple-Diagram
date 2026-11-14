// Reject placeholder fields, not a person's ordinary words about uncertainty.
export function containsUnknown(value: unknown): boolean {
  if (typeof value === "string") return /<\s*unknown\s*>/i.test(value) || /^\s*unknown\s*$/i.test(value);
  if (Array.isArray(value)) return value.some(containsUnknown);
  if (value && typeof value === "object") return Object.values(value).some(containsUnknown);
  return false;
}
