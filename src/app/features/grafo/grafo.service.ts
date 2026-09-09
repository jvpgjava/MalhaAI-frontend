import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  CaminhoCriticoResponse,
  CaminhoResponse,
  ExplicacaoResponse,
  GrafoResponse,
} from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class GrafoService {
  private readonly http = inject(HttpClient);

  getGrafo(semestre?: string): Promise<GrafoResponse> {
    return firstValueFrom(
      this.http.get<GrafoResponse>('/api/grafo', {
        params: semestre ? { semestre } : {},
      }),
    );
  }

  getCaminhoCritico(semestre?: string): Promise<CaminhoCriticoResponse> {
    return firstValueFrom(
      this.http.get<CaminhoCriticoResponse>('/api/grafo/caminho-critico', {
        params: semestre ? { semestre } : {},
      }),
    );
  }

  getCaminho(destino: number, origem?: number, semestre?: string): Promise<CaminhoResponse> {
    const params: Record<string, string> = { destino: String(destino) };
    if (origem !== undefined) {
      params['origem'] = String(origem);
    }
    if (semestre) {
      params['semestre'] = semestre;
    }
    return firstValueFrom(this.http.get<CaminhoResponse>('/api/grafo/caminho', { params }));
  }

  getExplicacao(disciplinaId: number, semestre?: string): Promise<ExplicacaoResponse> {
    return firstValueFrom(
      this.http.get<ExplicacaoResponse>(`/api/explicacao/${disciplinaId}`, {
        params: semestre ? { semestre } : {},
      }),
    );
  }
}
