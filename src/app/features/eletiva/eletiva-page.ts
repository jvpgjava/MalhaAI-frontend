import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Disciplina } from '../../core/models/api.models';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { GrafoMapaComponent } from '../grafo/grafo-mapa/grafo-mapa';
import { GrafoService } from '../grafo/grafo.service';

@Component({
  selector: 'app-eletiva-page',
  standalone: true,
  imports: [FormsModule, BotaoComponent, CardComponent, GrafoMapaComponent],
  templateUrl: './eletiva-page.html',
  styleUrl: './eletiva-page.scss',
})
export class EletivaPage implements OnInit {
  private readonly grafoService = inject(GrafoService);

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly arestas = signal<{ preRequisitoId: number; disciplinaId: number }[]>([]);
  readonly caminhoCriticoIds = signal<number[]>([]);
  readonly destinoId = signal<number | null>(null);
  readonly rota = signal<number[]>([]);
  readonly loading = signal(true);
  readonly buscando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly destinoOptions = computed(() =>
    [...this.disciplinas()].sort((a, b) => a.nome.localeCompare(b.nome)),
  );

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [grafo, critico] = await Promise.all([
        this.grafoService.getGrafo(),
        this.grafoService.getCaminhoCritico(),
      ]);
      this.disciplinas.set(grafo.disciplinas);
      this.arestas.set(grafo.arestas);
      this.caminhoCriticoIds.set(critico.caminhoCriticoIds);
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
