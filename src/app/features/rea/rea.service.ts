import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ElegibilidadeRea } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ReaService {
  private readonly http = inject(HttpClient);

  listar(semestre?: string): Promise<ElegibilidadeRea[]> {
    const params = semestre ? new HttpParams().set('semestre', semestre) : undefined;
    return firstValueFrom(
      this.http.get<ElegibilidadeRea[]>('/api/aluno/rea', { params }),
    );
  }
}
