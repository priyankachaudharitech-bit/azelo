export type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class-name joiner. Avoids a clsx/tailwind-merge dependency for the
 * handful of conditional strings this project uses.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
      continue;
    }
    out.push(String(value));
  }

  return out.join(" ");
}