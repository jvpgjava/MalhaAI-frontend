import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { OfertaRequest, OfertaResponse } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class OfertaService {
  private readonly http = inject(HttpClient);

  salvar(request: OfertaRequest): Promise<OfertaResponse> {
    return firstValueFrom(this.http.post<OfertaResponse>('/api/oferta', request));
  }
}
