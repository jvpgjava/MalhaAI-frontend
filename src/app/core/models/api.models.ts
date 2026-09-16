export type Papel = 'ALUNO' | 'COORDENACAO';

export type MotivoRea = 'NAO_OFERTADA' | 'CONFLITO_HORARIO';

export interface AuthResponse {
  token: string;
  usuarioId: string;
  email: string;
  papel: Papel;
}

export interface CadastroRequest {
  email: string;
  senha: string;
  papel: Papel;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

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

export interface ProgressoResponse {
  usuarioId: string;
  disciplinasConcluidas: number[];
}

export interface ProgressoRequest {
  disciplinasConcluidas: number[];
}

export interface ElegibilidadeRea {
  disciplinaId: number;
  motivo: MotivoRea | string;
}

export interface OfertaRequest {
  disciplinaId: number;
  semestre: string;
  vagas: number;
  ofertada: boolean;
}

export interface OfertaResponse {
  id: number;
  disciplinaId: number;
  semestre: string;
  vagas: number;
  ofertada: boolean;
}

export interface ExplicacaoResponse {
  explicacao: string;
}

export interface OrientacaoEstruturada {
  resumo: string;
  ordemSugerida: string[];
  proximosPassos: string[];
  alertas: string[];
  estruturado: boolean;
}

export interface FonteOrientacao {
  titulo: string;
  trecho: string;
  similaridade: number;
}

export interface OrientacaoRequest {
  semestre: string;
  destinoPrioridadeId?: number | null;
}

export interface OrientacaoResponse {
  semestre: string;
  modo: 'INICIANTE' | 'PRIORIDADE' | string;
  destinoId: number | null;
  caminhoIds: number[];
  caminhoNomes: string[];
  proximasOfertadasIds: number[];
  proximasOfertadasNomes: string[];
  primeiraDisciplinaId: number | null;
  primeiraDisciplinaNome: string | null;
  orientacao: OrientacaoEstruturada;
  iaDisponivel: boolean;
  roadmapIndexado: boolean;
  fontesConsultadas: FonteOrientacao[];
}

export interface FonteDocumento {
  documentoId: number;
  titulo: string;
  trecho: string;
  similaridade: number;
}

export interface PerguntaResponse {
  resposta: string;
  fontes: FonteDocumento[];
}

export interface AuthUser {
  usuarioId: string;
  email: string;
  papel: Papel;
}
