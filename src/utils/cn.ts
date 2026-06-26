type ClassValue = string | false | null | undefined;

/** Minimal classnames joiner for NativeWind className strings. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
