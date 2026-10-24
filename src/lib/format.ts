/** 52_400 → '52s'. */
export function formatSeconds(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}
