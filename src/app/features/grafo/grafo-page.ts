import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { Disciplina } from '../../core/models/api.models';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { GrafoMapaComponent } from './grafo-mapa/grafo-mapa';
import { GrafoService } from './grafo.service';

@Component({
  selector: 'app-grafo-page',
  standalone: true,
  imports: [GrafoMapaComponent, CardComponent, BotaoComponent],
  templateUrl: './grafo-page.html',
  styleUrl: './grafo-page.scss',
})
export class GrafoPage implements OnInit {
  private readonly grafoService = inject(GrafoService);

  readonly selecionada = signal<Disciplina | null>(null);
  readonly reprovadas = signal<Set<number>>(new Set());
  readonly explicacao = signal<string | null>(null);
  readonly explicacaoLoading = signal(false);
  readonly explicacaoErro = signal<string | null>(null);
  private explicacaoRequestId = 0;

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly arestas = signal<{ preRequisitoId: number; disciplinaId: number }[]>([]);
  readonly caminhoCriticoIds = signal<number[]>([]);
  readonly totalBase = signal(0);
  readonly loading = signal(true);
  readonly erro = signal<string | null>(null);

  readonly totalExibido = computed(() => {
    const base = this.totalBase();
    const criticos = new Set(this.caminhoCriticoIds());
    let extra = 0;
    for (const id of this.reprovadas()) {
      if (criticos.has(id)) {
        extra += 1;
      }
    }
    return base + extra;
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  onSelecionar(disciplina: Disciplina): void {
    this.selecionada.set(disciplina);
    this.explicacao.set(null);
    this.explicacaoErro.set(null);
  }

  async carregarExplicacao(): Promise<void> {
    const disc = this.selecionada();
    if (!disc) {
      return;
    }
    const requestId = ++this.explicacaoRequestId;
    this.explicacaoLoading.set(true);
    this.explicacaoErro.set(null);
    try {
      const res = await this.grafoService.getExplicacao(disc.id);
      if (requestId !== this.explicacaoRequestId) {
        return;
      }
      this.explicacao.set(res.explicacao);
    } catch (err) {
      if (requestId !== this.explicacaoRequestId) {
        return;
      }
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 503) {
        this.explicacaoErro.set('Serviço de IA temporariamente indisponível.');
      } else {
        this.explicacaoErro.set('Não foi possível obter a explicação.');
      }
    } finally {
      if (requestId === this.explicacaoRequestId) {
        this.explicacaoLoading.set(false);
      }
    }
  }

  marcarReprovada(): void {
    const disc = this.selecionada();
    if (!disc) {
      return;
    }
    this.reprovadas.update((set) => {
      const next = new Set(set);
      next.add(disc.id);
      return next;
    });
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.erro.set(null);
    try {
      const [grafo, critico] = await Promise.all([
        this.grafoService.getGrafo(),
        this.grafoService.getCaminhoCritico(),
      ]);
      this.disciplinas.set(grafo.disciplinas);
      this.arestas.set(grafo.arestas);
      this.caminhoCriticoIds.set(critico.caminhoCriticoIds);
      this.totalBase.set(critico.totalSemestres);
    } catch {
      this.erro.set('Não foi possível carregar o grafo curricular. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
