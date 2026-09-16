import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Disciplina, OrientacaoResponse } from '../../core/models/api.models';
import { SEMESTRE_ATUAL, SEMESTRE_PRESETS, normalizarSemestre } from '../../core/semestre';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { OfertaService } from '../coordenacao/oferta.service';
import { ProgressoService } from '../progresso/progresso.service';
import { GrafoMapaComponent } from './grafo-mapa/grafo-mapa';
import { GrafoService } from './grafo.service';

@Component({
  selector: 'app-grafo-page',
  standalone: true,
  imports: [FormsModule, GrafoMapaComponent, CardComponent, BotaoComponent],
  templateUrl: './grafo-page.html',
  styleUrl: './grafo-page.scss',
})
export class GrafoPage implements OnInit {
  private readonly grafoService = inject(GrafoService);
  private readonly progressoService = inject(ProgressoService);
  private readonly ofertaService = inject(OfertaService);

  readonly selecionada = signal<Disciplina | null>(null);
  readonly reprovadas = signal<Set<number>>(new Set());
  readonly explicacao = signal<string | null>(null);
  readonly explicacaoLoading = signal(false);
  readonly explicacaoErro = signal<string | null>(null);
  private explicacaoRequestId = 0;

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly arestas = signal<{ preRequisitoId: number; disciplinaId: number }[]>([]);
  readonly caminhoCriticoIds = signal<number[]>([]);
  readonly concluidasIds = signal<number[]>([]);
  readonly ofertadasIds = signal<number[]>([]);
  readonly rotaSemestre = signal<number[]>([]);
  readonly totalBase = signal(0);
  readonly loading = signal(true);
  readonly erro = signal<string | null>(null);

  readonly semestreInput = signal(SEMESTRE_ATUAL);
  readonly semestre = signal(SEMESTRE_ATUAL);
  readonly semestresOpcoes = signal<string[]>([...SEMESTRE_PRESETS]);
  readonly modoBusca = signal<'INICIANTE' | 'PRIORIDADE'>('INICIANTE');
  readonly prioridadeId = signal<number | null>(null);
  readonly buscando = signal(false);
  readonly orientacao = signal<OrientacaoResponse | null>(null);
  readonly orientacaoErro = signal<string | null>(null);

  readonly prioridadesOptions = computed(() =>
    [...this.disciplinas()]
      .filter((d) => !this.concluidasIds().includes(d.id))
      .sort((a, b) => a.nome.localeCompare(b.nome)),
  );

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
    try {
      const sems = await this.ofertaService.listarSemestres();
      if (sems.length) {
        this.semestresOpcoes.set([...new Set([...SEMESTRE_PRESETS, ...sems])].sort());
      }
    } catch {
      /* presets locais */
    }
    await this.reload();
  }

  onSelecionar(disciplina: Disciplina): void {
    this.selecionada.set(disciplina);
    this.explicacao.set(null);
    this.explicacaoErro.set(null);
  }

  onSemestreChange(event: Event): void {
    this.semestreInput.set((event.target as HTMLInputElement | HTMLSelectElement).value);
  }

  onModoChange(modo: 'INICIANTE' | 'PRIORIDADE'): void {
    this.modoBusca.set(modo);
    if (modo === 'INICIANTE') {
      this.prioridadeId.set(null);
    }
  }

  onPrioridadeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const id = Number(value);
    this.prioridadeId.set(Number.isFinite(id) && value !== '' ? id : null);
  }

  async aplicarSemestre(): Promise<void> {
    const canon = normalizarSemestre(this.semestreInput());
    if (!canon) {
      this.erro.set('Semestre inválido. Use 2025.1 ou 2025/1.');
      return;
    }
    this.semestre.set(canon);
    this.semestreInput.set(canon);
    this.orientacao.set(null);
    await this.reload();
  }

  async buscarMelhorCaminho(): Promise<void> {
    const canon = normalizarSemestre(this.semestreInput()) ?? this.semestre();
    if (!normalizarSemestre(canon)) {
      this.orientacaoErro.set('Informe um semestre válido (ex.: 2025.1).');
      return;
    }
    if (this.modoBusca() === 'PRIORIDADE' && this.prioridadeId() === null) {
      this.orientacaoErro.set('Escolha a disciplina prioritária.');
      return;
    }

    this.buscando.set(true);
    this.orientacaoErro.set(null);
    // Limpa resultado anterior para não manter trajeto/destaques enquanto carrega
    this.orientacao.set(null);
    this.rotaSemestre.set([]);
    this.caminhoCriticoIds.set([]);
    this.ofertadasIds.set([]);
    this.selecionada.set(null);
    this.explicacao.set(null);
    this.explicacaoErro.set(null);

    try {
      this.semestre.set(canon);
      const res = await this.grafoService.orientar({
        semestre: canon,
        destinoPrioridadeId:
          this.modoBusca() === 'PRIORIDADE' ? this.prioridadeId() : null,
      });
      this.orientacao.set(res);
      this.rotaSemestre.set(res.caminhoIds.map(Number));
      this.caminhoCriticoIds.set(res.caminhoIds.map(Number));
      this.ofertadasIds.set(res.proximasOfertadasIds.map(Number));
      try {
        const ofertas = await this.ofertaService.listar(canon);
        const concluidas = new Set(this.concluidasIds());
        this.ofertadasIds.set(
          ofertas
            .filter((o) => o.ofertada && !concluidas.has(Number(o.disciplinaId)))
            .map((o) => Number(o.disciplinaId)),
        );
      } catch {
        // mantém proximasOfertadasIds da orientação
      }
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      this.orientacaoErro.set(
        httpErr.status === 400
          ? (httpErr.error?.message ?? 'Semestre ou destino inválido.')
          : httpErr.status === 503
            ? 'IA indisponível, mas o trajeto pode ser recalculado em seguida.'
            : 'Não foi possível buscar o melhor caminho.',
      );
    } finally {
      this.buscando.set(false);
    }
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
      const res = await this.grafoService.getExplicacao(disc.id, this.semestre());
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
      const semestre = this.semestre();
      const [grafo, critico, progresso, ofertas] = await Promise.all([
        this.grafoService.getGrafo(),
        this.grafoService.getCaminhoCritico(undefined, true),
        this.progressoService.getProgresso(),
        this.ofertaService.listar(semestre),
      ]);

      this.disciplinas.set(grafo.disciplinas);
      this.arestas.set(grafo.arestas);

      const criticos = critico.caminhoCriticoIds.map(Number);
      this.caminhoCriticoIds.set(criticos);
      this.totalBase.set(critico.totalSemestres);

      const concluidas = new Set(
        (Array.isArray(progresso.disciplinasConcluidas)
          ? progresso.disciplinasConcluidas
          : [...(progresso.disciplinasConcluidas as unknown as number[])]
        ).map(Number),
      );
      this.concluidasIds.set([...concluidas]);

      const ofertadasPendentes = ofertas
        .filter((o) => o.ofertada && !concluidas.has(Number(o.disciplinaId)))
        .map((o) => Number(o.disciplinaId));
      this.ofertadasIds.set(ofertadasPendentes);

      if (!this.orientacao()) {
        this.rotaSemestre.set(criticos);
      }
    } catch {
      this.erro.set('Não foi possível carregar o grafo curricular. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
