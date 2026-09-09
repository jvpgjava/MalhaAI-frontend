import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Disciplina } from '../../core/models/api.models';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { GrafoService } from '../grafo/grafo.service';
import { CoordenacaoService } from './coordenacao.service';

interface LinhaEstado {
  disciplinaId: number;
  vagas: number;
  ofertada: boolean;
}

@Component({
  selector: 'app-coordenacao-page',
  standalone: true,
  imports: [ReactiveFormsModule, BotaoComponent, CardComponent],
  templateUrl: './coordenacao-page.html',
  styleUrl: './coordenacao-page.scss',
})
export class CoordenacaoPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly grafoService = inject(GrafoService);
  private readonly coordenacaoService = inject(CoordenacaoService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly disciplinas = signal<Disciplina[]>([]);

  private snapshot: LinhaEstado[] = [];

  readonly form = this.fb.group({
    semestre: this.fb.nonNullable.control('2026.1', Validators.required),
    linhas: this.fb.array<FormGroup>([]),
  });

  get linhas(): FormArray<FormGroup> {
    return this.form.controls.linhas;
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const grafo = await this.grafoService.getGrafo();
      const ordenadas = [...grafo.disciplinas].sort(
        (a, b) => a.semestreSugerido - b.semestreSugerido || a.nome.localeCompare(b.nome),
      );
      this.disciplinas.set(ordenadas);
      this.linhas.clear();
      this.snapshot = [];
      for (const d of ordenadas) {
        const group = this.fb.nonNullable.group({
          disciplinaId: d.id,
          nome: d.nome,
          vagas: [40, [Validators.required, Validators.min(0)]],
          ofertada: true,
        });
        this.linhas.push(group);
        this.snapshot.push({ disciplinaId: d.id, vagas: 40, ofertada: true });
      }
    } catch {
      this.erro.set('Não foi possível carregar as disciplinas.');
    } finally {
      this.loading.set(false);
    }
  }

  async salvar(): Promise<void> {
    this.erro.set(null);
    this.sucesso.set(null);
    if (this.form.invalid) {
      this.erro.set('Revise os campos inválidos.');
      return;
    }

    const semestre = this.form.controls.semestre.value;
    const alteradas = this.linhas.controls
      .map((ctrl) => ctrl.getRawValue() as {
        disciplinaId: number;
        vagas: number;
        ofertada: boolean;
      })
      .filter((linha) => {
        const prev = this.snapshot.find((s) => s.disciplinaId === linha.disciplinaId);
        return !prev || prev.vagas !== linha.vagas || prev.ofertada !== linha.ofertada;
      });

    if (alteradas.length === 0) {
      this.sucesso.set('Nenhuma alteração para salvar.');
      return;
    }

    this.saving.set(true);
    try {
      await Promise.all(
        alteradas.map((linha) =>
          firstValueFrom(
            this.coordenacaoService.salvarOferta({
              disciplinaId: linha.disciplinaId,
              semestre,
              vagas: Number(linha.vagas),
              ofertada: Boolean(linha.ofertada),
            }),
          ),
        ),
      );
      this.snapshot = this.linhas.controls.map((ctrl) => {
        const v = ctrl.getRawValue() as { disciplinaId: number; vagas: number; ofertada: boolean };
        return { disciplinaId: v.disciplinaId, vagas: Number(v.vagas), ofertada: Boolean(v.ofertada) };
      });
      this.sucesso.set(`${alteradas.length} oferta(s) salva(s) com sucesso.`);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      this.erro.set(
        httpErr.status === 403
          ? 'Apenas coordenação pode salvar ofertas.'
          : 'Falha ao salvar uma ou mais ofertas.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
