import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FonteDocumento } from '../../core/models/api.models';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { DuvidasService } from './duvidas.service';

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  fontes?: FonteDocumento[];
}

@Component({
  selector: 'app-duvidas-page',
  standalone: true,
  imports: [FormsModule, BotaoComponent, CardComponent, DecimalPipe],
  templateUrl: './duvidas-page.html',
  styleUrl: './duvidas-page.scss',
})
export class DuvidasPage {
  private readonly duvidasService = inject(DuvidasService);
  private nextId = 1;

  readonly mensagens = signal<ChatMessage[]>([]);
  readonly pergunta = signal('');
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);

  async enviar(): Promise<void> {
    const texto = this.pergunta().trim();
    if (!texto || this.loading()) {
      return;
    }

    this.erro.set(null);
    this.mensagens.update((list) => [
      ...list,
      { id: this.nextId++, role: 'user', text: texto },
    ]);
    this.pergunta.set('');
    this.loading.set(true);

    try {
      const res = await this.duvidasService.perguntar(texto);
      this.mensagens.update((list) => [
        ...list,
        {
          id: this.nextId++,
          role: 'ai',
          text: res.resposta,
          fontes: res.fontes ?? [],
        },
      ]);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 503) {
        this.erro.set(
          'Serviço de IA temporariamente indisponível (503). Tente novamente em instantes.',
        );
      } else {
        this.erro.set('Não foi possível obter resposta. Tente novamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
