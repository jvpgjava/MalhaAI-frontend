import { describe, expect, it } from 'vitest';

import { Disciplina } from '../../../core/models/api.models';
import { calcularLayoutGrafo } from './calcular-layout-grafo';

describe('calcularLayoutGrafo', () => {
  const disciplinas: Disciplina[] = [
    { id: 2, nome: 'Calc 2', semestreSugerido: 2, cargaHoraria: 60 },
    { id: 1, nome: 'Calc 1', semestreSugerido: 1, cargaHoraria: 60 },
    { id: 3, nome: 'Alg Linear', semestreSugerido: 1, cargaHoraria: 60 },
    { id: 4, nome: 'Física', semestreSugerido: 2, cargaHoraria: 60 },
  ];

  it('places nodes in columns by semestreSugerido', () => {
    const layout = calcularLayoutGrafo(disciplinas, {
      columnWidth: 100,
      rowHeight: 50,
      paddingX: 10,
      paddingY: 20,
    });

    const byId = new Map(layout.map((p) => [p.id, p]));

    expect(byId.get(1)?.x).toBe(10);
    expect(byId.get(3)?.x).toBe(10);
    expect(byId.get(2)?.x).toBe(110);
    expect(byId.get(4)?.x).toBe(110);
  });

  it('stacks nodes vertically within the same semester', () => {
    const layout = calcularLayoutGrafo(disciplinas, {
      columnWidth: 100,
      rowHeight: 50,
      paddingX: 10,
      paddingY: 20,
    });
    const byId = new Map(layout.map((p) => [p.id, p]));

    // id 1 before id 3 in semester 1
    expect(byId.get(1)?.y).toBe(20);
    expect(byId.get(3)?.y).toBe(70);
  });

  it('returns empty array for empty input', () => {
    expect(calcularLayoutGrafo([])).toEqual([]);
  });
});
