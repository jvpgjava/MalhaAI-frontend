import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { OfertaRequest, OfertaResponse } from '../../core/models/api.models';
import { normalizarSemestre } from '../../core/semestre';

@Injectable({ providedIn: 'root' })
export class OfertaService {
  private readonly http = inject(HttpClient);

  listar(semestre: string): Promise<OfertaResponse[]> {
    const canon = normalizarSemestre(semestre) ?? semestre;
    return firstValueFrom(
      this.http.get<OfertaResponse[]>('/api/oferta', { params: { semestre: canon } }),
    );
  }

  listarSemestres(): Promise<string[]> {
    return firstValueFrom(this.http.get<string[]>('/api/oferta/semestres'));
  }

  salvar(body: OfertaRequest): Observable<OfertaResponse> {
    const semestre = normalizarSemestre(body.semestre) ?? body.semestre;
    return this.http.post<OfertaResponse>('/api/oferta', { ...body, semestre });
  }
}
