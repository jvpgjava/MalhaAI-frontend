/** Semestre letivo canônico: YYYY.N (aceita também YYYY/N no input). */
export const SEMESTRE_ATUAL = '2026.1';

export const SEMESTRE_PRESETS = ['2025.1', '2025.2', '2026.1', '2026.2'] as const;

/** Normaliza `2025/1`, `2025-1`, `2025.1` → `2025.1`. */
export function normalizarSemestre(bruto: string): string | null {
  const m = bruto.trim().match(/^(\d{4})\s*[./\-]?\s*([12])$/);
  if (!m) {
    return null;
  }
  return `${m[1]}.${m[2]}`;
}
