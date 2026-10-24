/** 52_400 → '52s'. */
export function formatSeconds(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

/** Horário (ms) → ISO 8601 em UTC, como no histórico. */
export function toIsoString(ms: number): string {
  return new Date(ms).toISOString();
}
