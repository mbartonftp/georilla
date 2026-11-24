/* localStorage that never throws: private windows and blocked storage just fall back to defaults. */
export const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
  },
  set(k: string, v: unknown): void {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ }
  }
};
