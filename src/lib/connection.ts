/**
 * Returns true when we may safely load a heavy asset (drone video) —
 * fast connection, no explicit save-data, and no reduced-motion.
 */
export function canLoadHeavyMedia(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  if (!conn) return true; // Unknown: don't punish desktop browsers.
  if (conn.saveData) return false;
  if (conn.effectiveType && !["4g"].includes(conn.effectiveType)) return false;
  return true;
}
