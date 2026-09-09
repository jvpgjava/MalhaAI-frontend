import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Disciplina } from '../../core/models/api.models';
import { GrafoService } from '../grafo/grafo.service';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { ProgressoService } from './progresso.service';

@Component({
  selector: 'app-progresso-page',
  standalone: true,
  imports: [FormsModule, BotaoComponent, CardComponent],
  templateUrl: './progresso-page.html',
  styleUrl: './progresso-page.scss',
})
export class ProgressoPage implements OnInit {
  private readonly progressoService = inject(ProgressoService);
  private readonly grafoService = inject(GrafoService);

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly concluidas = signal<Set<number>>(new Set());
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  async carregar(): Promise<void> {
    this.loading.set(true);
    this.erro.set(null);
    try {
      const [grafo, progresso] = await Promise.all([
        this.grafoService.getGrafo(),
        this.progressoService.getProgresso(),
      ]);
      const ordenadas = [...grafo.disciplinas].sort(
        (a, b) => a.semestreSugerido - b.semestreSugerido || a.nome.localeCompare(b.nome),
      );
      this.disciplinas.set(ordenadas);
      const ids = Array.isArray(progresso.disciplinasConcluidas)
        ? progresso.disciplinasConcluidas
        : [...(progresso.disciplinasConcluidas as unknown as number[])];
      this.concluidas.set(new Set(ids));
    } catch {
      this.erro.set('Não foi possível carregar o progresso.');
    } finally {
      this.loading.set(false);
    }
  }

  onToggle(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.concluidas.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
    this.sucesso.set(null);
  }

  isConcluida(id: number): boolean {
    return this.concluidas().has(id);
  }

  async salvar(): Promise<void> {
    this.saving.set(true);
    this.erro.set(null);
    this.sucesso.set(null);
    try {
      await this.progressoService.salvarProgresso([...this.concluidas()]);
      this.sucesso.set('Progresso salvo com sucesso.');
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      this.erro.set(
        httpErr.status === 401
          ? 'Sessão expirada. Faça login novamente.'
          : 'Não foi possível salvar o progresso.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
