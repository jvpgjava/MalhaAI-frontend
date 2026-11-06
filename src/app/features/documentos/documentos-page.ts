import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { safeErrorMessage } from '../../core/http/safe-error';
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
      this.erro.set(
        safeErrorMessage(err, 'Falha ao indexar documentos.', {
          403: 'Seu papel não pode indexar documentos.',
          503: 'Serviço de embeddings/IA indisponível no momento.',
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
