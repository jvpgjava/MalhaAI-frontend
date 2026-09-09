import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PerguntaResponse } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class DuvidasService {
  private readonly http = inject(HttpClient);

  perguntar(pergunta: string): Promise<PerguntaResponse> {
    return firstValueFrom(
      this.http.post<PerguntaResponse>('/api/perguntas', { pergunta }),
    );
  }
}
