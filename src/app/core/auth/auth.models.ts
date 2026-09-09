export type Papel = 'ALUNO' | 'COORDENACAO';

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

export interface ApiErrorBody {
  message: string;
}
