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

const SESSION_KEY = 'malhaia.auth';

interface StoredSession {
  token: string;
  usuario: AuthUser;
  displayName: string | null;
}

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

  constructor() {
    this.restoreSession();
  }

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
    sessionStorage.removeItem(SESSION_KEY);
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
    this.persistSession();
  }

  private persistSession(): void {
    const token = this.token();
    const usuario = this.usuario();
    if (!token || !usuario) {
      return;
    }
    const payload: StoredSession = {
      token,
      usuario,
      displayName: this.displayName(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed?.token || !parsed?.usuario?.usuarioId || !parsed?.usuario?.email) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      this.token.set(parsed.token);
      this.usuario.set(parsed.usuario);
      this.displayName.set(
        parsed.displayName ?? parsed.usuario.email.split('@')[0] ?? parsed.usuario.email,
      );
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
}

export type { Papel };
