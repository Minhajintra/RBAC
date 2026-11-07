/**
 * Common Utility Functions
 * Simple, human-readable helper utilities
 */

/**
 * Combines multiple class name strings, ignoring falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats a date into a human-readable string (e.g., "Nov 3, 2026")
 */
export function formatDate(dateInput: string | Date | number): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a number with comma separators (e.g., 1,234)
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

