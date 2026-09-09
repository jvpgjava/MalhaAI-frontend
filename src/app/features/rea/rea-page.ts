import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { Disciplina, ElegibilidadeRea, MotivoRea } from '../../core/models/api.models';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { GrafoService } from '../grafo/grafo.service';
import { ReaService } from './rea.service';

interface ReaCardView {
  disciplinaId: number;
  nome: string;
  motivo: string;
  motivoLabel: string;
}

@Component({
  selector: 'app-rea-page',
  standalone: true,
  imports: [BotaoComponent, CardComponent],
  templateUrl: './rea-page.html',
  styleUrl: './rea-page.scss',
})
export class ReaPage implements OnInit {
  private readonly reaService = inject(ReaService);
  private readonly grafoService = inject(GrafoService);

  readonly itens = signal<ElegibilidadeRea[]>([]);
  readonly disciplinas = signal<Disciplina[]>([]);
  readonly loading = signal(true);
  readonly erro = signal<string | null>(null);

  readonly cards = computed<ReaCardView[]>(() => {
    const byId = new Map(this.disciplinas().map((d) => [d.id, d]));
    return this.itens().map((item) => ({
      disciplinaId: item.disciplinaId,
      nome: byId.get(item.disciplinaId)?.nome ?? `Disciplina #${item.disciplinaId}`,
      motivo: String(item.motivo),
      motivoLabel: this.labelMotivo(item.motivo),
    }));
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [rea, grafo] = await Promise.all([
        this.reaService.listar('2026.1'),
        this.grafoService.getGrafo(),
      ]);
      this.itens.set(rea);
      this.disciplinas.set(grafo.disciplinas);
    } catch {
      this.erro.set('Não foi possível carregar a elegibilidade REA.');
    } finally {
      this.loading.set(false);
    }
  }

  private labelMotivo(motivo: MotivoRea | string): string {
    switch (motivo) {
      case 'NAO_OFERTADA':
        return 'Não ofertada';
      case 'CONFLITO_HORARIO':
        return 'Conflito de horário';
      default:
        return String(motivo);
    }
  }
}
