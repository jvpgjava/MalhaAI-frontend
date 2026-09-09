import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ProgressoRequest, ProgressoResponse } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProgressoService {
  private readonly http = inject(HttpClient);

  getProgresso(): Promise<ProgressoResponse> {
    return firstValueFrom(this.http.get<ProgressoResponse>('/api/aluno/progresso'));
  }

  salvarProgresso(disciplinasConcluidas: number[]): Promise<ProgressoResponse> {
    const body: ProgressoRequest = { disciplinasConcluidas };
    return firstValueFrom(this.http.put<ProgressoResponse>('/api/aluno/progresso', body));
  }
}
