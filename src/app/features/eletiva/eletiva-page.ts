import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Disciplina } from '../../core/models/api.models';
import { SEMESTRE_ATUAL } from '../../core/semestre';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { OfertaService } from '../coordenacao/oferta.service';
import { GrafoMapaComponent } from '../grafo/grafo-mapa/grafo-mapa';
import { GrafoService } from '../grafo/grafo.service';
import { ProgressoService } from '../progresso/progresso.service';

@Component({
  selector: 'app-eletiva-page',
  standalone: true,
  imports: [FormsModule, BotaoComponent, CardComponent, GrafoMapaComponent],
  templateUrl: './eletiva-page.html',
  styleUrl: './eletiva-page.scss',
})
export class EletivaPage implements OnInit {
  private readonly grafoService = inject(GrafoService);
  private readonly progressoService = inject(ProgressoService);
  private readonly ofertaService = inject(OfertaService);

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly arestas = signal<{ preRequisitoId: number; disciplinaId: number }[]>([]);
  readonly concluidasIds = signal<number[]>([]);
  readonly ofertadasIds = signal<number[]>([]);
  readonly destinoId = signal<number | null>(null);
  readonly rota = signal<number[]>([]);
  readonly loading = signal(true);
  readonly buscando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly destinoOptions = computed(() =>
    [...this.disciplinas()]
      .filter((d) => !this.concluidasIds().includes(d.id))
      .sort((a, b) => a.nome.localeCompare(b.nome)),
  );

  readonly rotaNomes = computed(() => {
    const byId = new Map(this.disciplinas().map((d) => [d.id, d.nome]));
    return this.rota()
      .map((id) => byId.get(id) ?? String(id))
      .join(' → ');
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [grafo, progresso, ofertas] = await Promise.all([
        this.grafoService.getGrafo(),
        this.progressoService.getProgresso(),
        this.ofertaService.listar(SEMESTRE_ATUAL),
      ]);
      this.disciplinas.set(grafo.disciplinas);
      this.arestas.set(grafo.arestas);
      const concluidas = (
        Array.isArray(progresso.disciplinasConcluidas)
          ? progresso.disciplinasConcluidas
          : [...(progresso.disciplinasConcluidas as unknown as number[])]
      ).map(Number);
      this.concluidasIds.set(concluidas);
      this.ofertadasIds.set(
        ofertas
          .filter((o) => o.ofertada && !concluidas.includes(Number(o.disciplinaId)))
          .map((o) => Number(o.disciplinaId)),
      );
    } catch {
      this.erro.set('Não foi possível carregar o grafo.');
    } finally {
      this.loading.set(false);
    }
  }

  onDestinoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const id = Number(value);
    this.destinoId.set(Number.isFinite(id) && value !== '' ? id : null);
    this.rota.set([]);
  }

  async buscar(): Promise<void> {
    const destino = this.destinoId();
    if (destino === null) {
      this.erro.set('Selecione uma disciplina de destino.');
      return;
    }
    this.buscando.set(true);
    this.erro.set(null);
    try {
      // Sem filtrar o grafo por oferta: progresso do aluno já entra no Dijkstra.
      // Ofertadas aparecem no mapa para o aluno ver o que dá para pegar no semestre.
      const res = await this.grafoService.getCaminho(destino);
      this.rota.set(res.caminho);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      this.erro.set(
        httpErr.status === 404
          ? 'Caminho não encontrado para o destino selecionado.'
          : 'Não foi possível calcular o caminho.',
      );
      this.rota.set([]);
    } finally {
      this.buscando.set(false);
    }
  }
}
