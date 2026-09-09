import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  AuthUser,
  CadastroRequest,
  LoginRequest,
} from '../models/api.models';
import { Papel } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(null);
  readonly usuario = signal<AuthUser | null>(null);
  readonly displayName = signal<string | null>(null);

  /** Alias usado pelas páginas / navbar */
  readonly currentUser = this.usuario;

  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly isCoordenacao = computed(() => this.usuario()?.papel === 'COORDENACAO');

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap((response) => this.applySession(response)),
    );
  }

  cadastro(request: CadastroRequest, nomeCompleto?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/cadastro', request).pipe(
      tap((response) => this.applySession(response, nomeCompleto)),
    );
  }

  logout(): void {
    this.token.set(null);
    this.usuario.set(null);
    this.displayName.set(null);
  }

  private applySession(response: AuthResponse, nomeCompleto?: string): void {
    this.token.set(response.token);
    this.usuario.set({
      usuarioId: response.usuarioId,
      email: response.email,
      papel: response.papel,
    });
    if (nomeCompleto?.trim()) {
      this.displayName.set(nomeCompleto.trim());
    } else if (!this.displayName()) {
      this.displayName.set(response.email.split('@')[0] ?? response.email);
    }
  }
}

export type { Papel };
