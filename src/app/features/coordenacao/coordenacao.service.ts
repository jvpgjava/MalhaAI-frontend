import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { OfertaRequest, OfertaResponse } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class CoordenacaoService {
  private readonly http = inject(HttpClient);

  salvarOferta(body: OfertaRequest): Observable<OfertaResponse> {
    return this.http.post<OfertaResponse>('/api/oferta', body);
  }
}
