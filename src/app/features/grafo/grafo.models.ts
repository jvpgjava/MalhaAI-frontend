export interface Disciplina {
  id: number;
  nome: string;
  semestreSugerido: number;
  cargaHoraria: number;
}

export interface Aresta {
  preRequisitoId: number;
  disciplinaId: number;
}

export interface GrafoResponse {
  disciplinas: Disciplina[];
  arestas: Aresta[];
}

export interface CaminhoCriticoResponse {
  semestreMinimoPorDisciplina: Record<string, number>;
  totalSemestres: number;
  caminhoCriticoIds: number[];
}

export interface CaminhoResponse {
  caminho: number[];
}

export interface ExplicacaoResponse {
  explicacao: string;
}

export interface LayoutNode {
  id: number;
  x: number;
  y: number;
}

export interface LayoutOptions {
  colWidth?: number;
  rowHeight?: number;
  paddingX?: number;
  paddingY?: number;
}
