import { Disciplina } from '../../../core/models/api.models';

export interface PosicaoNo {
  id: number;
  x: number;
  y: number;
}

export interface LayoutGrafoOptions {
  columnWidth?: number;
  rowHeight?: number;
  paddingX?: number;
  paddingY?: number;
}

/**
 * Layout puro: colunas por semestreSugerido, empilhamento vertical por ordem de id.
 */
export function calcularLayoutGrafo(
  disciplinas: readonly Disciplina[],
  options: LayoutGrafoOptions = {},
): PosicaoNo[] {
  const columnWidth = options.columnWidth ?? 180;
  const rowHeight = options.rowHeight ?? 100;
  const paddingX = options.paddingX ?? 80;
  const paddingY = options.paddingY ?? 60;

  const porSemestre = new Map<number, Disciplina[]>();
  for (const d of disciplinas) {
    const lista = porSemestre.get(d.semestreSugerido) ?? [];
    lista.push(d);
    porSemestre.set(d.semestreSugerido, lista);
  }

  for (const lista of porSemestre.values()) {
    lista.sort((a, b) => a.id - b.id || a.nome.localeCompare(b.nome));
  }

  const semestres = [...porSemestre.keys()].sort((a, b) => a - b);
  const semestreIndex = new Map(semestres.map((s, i) => [s, i]));

  return disciplinas.map((d) => {
    const col = semestreIndex.get(d.semestreSugerido) ?? 0;
    const naColuna = porSemestre.get(d.semestreSugerido) ?? [];
    const row = naColuna.findIndex((x) => x.id === d.id);
    return {
      id: d.id,
      x: paddingX + col * columnWidth,
      y: paddingY + Math.max(row, 0) * rowHeight,
    };
  });
}
