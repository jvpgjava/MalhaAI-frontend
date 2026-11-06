import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { ModalComponent } from '../../ui/modal/modal';

@Component({
  selector: 'app-documentos-page',
  standalone: true,
  imports: [BotaoComponent, CardComponent, ModalComponent],
  templateUrl: './documentos-page.html',
  styleUrl: './documentos-page.scss',
})
export class DocumentosPage {
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);
  readonly resultadoOpen = signal(false);
  readonly chunks = signal<number | null>(null);

  async indexar(): Promise<void> {
    this.erro.set(null);
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ chunksIndexados: number }>('/api/documentos/indexar', {}),
      );
      this.chunks.set(res.chunksIndexados ?? 0);
      this.resultadoOpen.set(true);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 503) {
        this.erro.set(
          'Serviço de embeddings/IA indisponível (503). Configure GOOGLE_API_KEY e tente de novo.',
        );
      } else if (httpErr.status === 403) {
        this.erro.set('Seu papel não pode indexar documentos.');
      } else {
        this.erro.set(
          typeof httpErr.error?.message === 'string'
            ? httpErr.error.message
            : 'Falha ao indexar documentos.',
        );
      }
    } finally {
      this.loading.set(false);
    }
  }
}
