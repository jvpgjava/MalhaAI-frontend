export type Papel = 'ALUNO' | 'PROFESSOR' | 'COORDENACAO' | 'DEV';

export const PAPEIS: readonly Papel[] = ['ALUNO', 'PROFESSOR', 'COORDENACAO', 'DEV'] as const;

export function labelPapel(papel: Papel | null | undefined): string {
  switch (papel) {
    case 'ALUNO':
      return 'Estudante';
    case 'PROFESSOR':
      return 'Professor';
    case 'COORDENACAO':
      return 'Coordenação';
    case 'DEV':
      return 'Dev';
    default:
      return 'Usuário';
  }
}

export function isAluno(papel: Papel | null | undefined): boolean {
  return papel === 'ALUNO';
}

export function isProfessor(papel: Papel | null | undefined): boolean {
  return papel === 'PROFESSOR' || papel === 'COORDENACAO' || papel === 'DEV';
}

export function isCoordenacao(papel: Papel | null | undefined): boolean {
  return papel === 'COORDENACAO' || papel === 'DEV';
}

export function isDev(papel: Papel | null | undefined): boolean {
  return papel === 'DEV';
}

export function canIndexarDocumentos(papel: Papel | null | undefined): boolean {
  return papel === 'PROFESSOR' || papel === 'COORDENACAO' || papel === 'DEV';
}

export function canGerirOferta(papel: Papel | null | undefined): boolean {
  return papel === 'COORDENACAO' || papel === 'DEV';
}

export function canAdminUsuarios(papel: Papel | null | undefined): boolean {
  return papel === 'DEV';
}

export interface AuthResponse {
  token: string;
  usuarioId: string;
  email: string;
  papel: Papel;
}

export interface AuthUser {
  usuarioId: string;
  email: string;
  papel: Papel;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface CadastroRequest {
  email: string;
  senha: string;
  papel: Papel;
}

export interface AdminCriarUsuarioRequest {
  email: string;
  senha: string;
  papel: Papel;
}

export interface AdminUsuarioResponse {
  usuarioId: string;
  email: string;
  papel: Papel;
}

export interface ApiErrorBody {
  message: string;
}
