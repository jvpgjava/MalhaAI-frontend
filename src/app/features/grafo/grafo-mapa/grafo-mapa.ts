import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as d3 from 'd3';

import { Aresta, Disciplina } from '../../../core/models/api.models';
import { calcularLayoutGrafo } from '../layout/calcular-layout-grafo';

@Component({
  selector: 'app-grafo-mapa',
  standalone: true,
  template: `
    <div class="mapa">
      <svg #svgEl class="mapa__svg" role="img" aria-label="Grafo curricular"></svg>
    </div>
  `,
  styleUrl: './grafo-mapa.scss',
})
export class GrafoMapaComponent {
  readonly disciplinas = input.required<Disciplina[]>();
  readonly arestas = input.required<Aresta[]>();
  readonly caminhoCriticoIds = input<number[]>([]);
  readonly rotaDestacada = input<number[]>([]);
  readonly concluidasIds = input<number[]>([]);
  readonly ofertadasIds = input<number[]>([]);
  readonly selecionadaId = input<number | null>(null);
  /** Revela colunas → arestas → caminho crítico (tela do grafo). */
  readonly animar = input(true);
  /** Acende a rota buscada nó a nó / aresta a aresta (eletiva / semestre). */
  readonly animarRota = input(false);

  readonly disciplinaSelecionada = output<Disciplina>();

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svgEl');
  private readonly destroyRef = inject(DestroyRef);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private lastSignature = '';

  constructor() {
    effect(() => {
      const svgRef = this.svgRef();
      if (!svgRef) {
        return;
      }

      const disciplinas = this.disciplinas();
      const arestas = this.arestas();
      const criticos = this.caminhoCriticoIds();
      const rota = this.rotaDestacada();
      const concluidas = this.concluidasIds();
      const ofertadas = this.ofertadasIds();
      const selecionada = this.selecionadaId();
      const animar = this.animar();
      const animarRota = this.animarRota();

      const signature = [
        disciplinas.map((d) => d.id).join(','),
        arestas.map((a) => `${a.preRequisitoId}->${a.disciplinaId}`).join(','),
        criticos.join(','),
        rota.join(','),
        concluidas.join(','),
        ofertadas.join(','),
        String(animarRota),
      ].join('|');

      const estruturaMudou = signature !== this.lastSignature;
      this.lastSignature = signature;

      this.limparTimers();
      this.desenhar(
        svgRef.nativeElement,
        disciplinas,
        arestas,
        new Set(criticos),
        rota,
        new Set(concluidas),
        new Set(ofertadas),
        selecionada,
        animar && estruturaMudou && !animarRota,
        animarRota && rota.length > 0 && estruturaMudou,
      );
    });

    this.destroyRef.onDestroy(() => this.limparTimers());
  }

  private limparTimers(): void {
    for (const t of this.timers) {
      clearTimeout(t);
    }
    this.timers = [];
  }

  private agendar(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private desenhar(
    svgEl: SVGSVGElement,
    disciplinas: Disciplina[],
    arestas: Aresta[],
    criticos: Set<number>,
    rotaOrdem: number[],
    concluidas: Set<number>,
    ofertadas: Set<number>,
    selecionada: number | null,
    animarGrafo: boolean,
    animarRota: boolean,
  ): void {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    if (disciplinas.length === 0) {
      svg.attr('viewBox', '0 0 400 200');
      return;
    }

    const layout = calcularLayoutGrafo(disciplinas, {
      columnWidth: 200,
      rowHeight: 118,
      paddingX: 72,
      paddingY: 56,
    });
    const byId = new Map(layout.map((p) => [p.id, p]));
    const rota = new Set(rotaOrdem);

    const maxX = Math.max(...layout.map((p) => p.x)) + 140;
    const maxY = Math.max(...layout.map((p) => p.y)) + 96;
    const width = Math.max(maxX, 720);
    const height = Math.max(maxY, 400);

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const styles = getComputedStyle(document.documentElement);
    const colorAccent = styles.getPropertyValue('--color-accent').trim() || '#e8366d';
    const colorTeal = styles.getPropertyValue('--color-teal').trim() || '#1a7a8a';
    const colorBorder = styles.getPropertyValue('--color-border').trim() || '#cfd8e3';
    const colorInk = styles.getPropertyValue('--color-ink').trim() || '#1e2761';
    const colorWarn = styles.getPropertyValue('--color-warn').trim() || '#e8914b';
    const colorDone = '#94a3b8';
    const colorOferta = '#0f766e';

    const gRoot = svg.append('g');

    // Fundo sutil em colunas
    const cols = new Map<number, number>();
    for (const d of disciplinas) {
      cols.set(d.semestreSugerido, (cols.get(d.semestreSugerido) ?? 0) + 1);
    }
    const semestres = [...new Set(disciplinas.map((d) => d.semestreSugerido))].sort((a, b) => a - b);
    const bg = gRoot.append('g').attr('class', 'bg');
    semestres.forEach((sem, i) => {
      bg.append('rect')
        .attr('x', 72 + i * 200 - 70)
        .attr('y', 16)
        .attr('width', 160)
        .attr('height', height - 32)
        .attr('rx', 18)
        .attr('fill', i % 2 === 0 ? 'rgba(30, 39, 97, 0.03)' : 'rgba(26, 122, 138, 0.04)');
      bg.append('text')
        .attr('x', 72 + i * 200)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('fill', colorInk)
        .attr('opacity', 0.35)
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(`S${sem}`);
    });

    const g = gRoot.append('g').attr('class', 'graph');
    const defs = svg.append('defs');

    const addMarker = (id: string, fill: string) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', fill);
    };
    addMarker('arrow', colorBorder);
    addMarker('arrow-rota', colorWarn);
    addMarker('arrow-critico', colorAccent);

    const arestasValidas = arestas.filter(
      (a) => byId.has(a.preRequisitoId) && byId.has(a.disciplinaId),
    );

    const esconderInicial = animarGrafo;
    const edgeSel = g
      .selectAll('path.edge')
      .data(arestasValidas)
      .enter()
      .append('path')
      .attr('class', 'edge')
      .attr('d', (a) => {
        const s = byId.get(a.preRequisitoId)!;
        const t = byId.get(a.disciplinaId)!;
        const mx = (s.x + t.x) / 2;
        return `M${s.x},${s.y} Q${mx},${s.y} ${t.x},${t.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', colorBorder)
      .attr('stroke-width', 1.6)
      .attr('marker-end', 'url(#arrow)')
      .attr('opacity', esconderInicial ? 0 : 0.85);

    const nodes = g
      .selectAll('g.node')
      .data(disciplinas)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => {
        const p = byId.get(d.id)!;
        return `translate(${p.x},${p.y})`;
      })
      .style('cursor', 'pointer')
      .attr('opacity', esconderInicial ? 0 : 1)
      .on('click', (_event, d) => this.disciplinaSelecionada.emit(d));

    nodes
      .append('circle')
      .attr('class', 'node-halo')
      .attr('r', 26)
      .attr('fill', 'none')
      .attr('stroke', colorOferta)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 3')
      .attr('opacity', (d) => (ofertadas.has(d.id) && !concluidas.has(d.id) ? 0.95 : 0));

    nodes
      .append('circle')
      .attr('class', 'node-body')
      .attr('r', esconderInicial ? 0 : 20)
      .attr('fill', colorTeal)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(30,39,97,0.12))');

    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', 38)
      .attr('fill', colorInk)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('opacity', esconderInicial ? 0 : 0.92)
      .each(function (d) {
        const el = d3.select(this);
        const words = d.nome.split(/\s+/);
        const lines: string[] = [];
        let line = '';
        for (const w of words) {
          const next = line ? `${line} ${w}` : w;
          if (next.length > 16 && line) {
            lines.push(line);
            line = w;
          } else {
            line = next;
          }
        }
        if (line) {
          lines.push(line);
        }
        lines.slice(0, 2).forEach((l, i) => {
          el.append('tspan').attr('x', 0).attr('dy', i === 0 ? 0 : '1.1em').text(l);
        });
      });

    const isArestaRota = (a: Aresta, ateIndice: number): boolean => {
      for (let i = 0; i < ateIndice; i++) {
        if (rotaOrdem[i] === a.preRequisitoId && rotaOrdem[i + 1] === a.disciplinaId) {
          return true;
        }
      }
      return false;
    };

    const isArestaCritica = (a: Aresta): boolean =>
      criticos.has(a.preRequisitoId) && criticos.has(a.disciplinaId);

    const corNo = (d: Disciplina): string => {
      if (concluidas.has(d.id)) {
        return colorDone;
      }
      if (rota.has(d.id)) {
        return colorWarn;
      }
      if (criticos.has(d.id)) {
        return colorAccent;
      }
      if (ofertadas.has(d.id)) {
        return colorOferta;
      }
      return colorTeal;
    };

    const corAresta = (a: Aresta): string => {
      if (concluidas.has(a.preRequisitoId) && concluidas.has(a.disciplinaId)) {
        return '#cbd5e1';
      }
      if (rota.has(a.preRequisitoId) && rota.has(a.disciplinaId) && isArestaRota(a, rotaOrdem.length - 1)) {
        return colorWarn;
      }
      if (isArestaCritica(a)) {
        return colorAccent;
      }
      return colorBorder;
    };

    const markerAresta = (a: Aresta): string => {
      const stroke = corAresta(a);
      if (stroke === colorWarn) {
        return 'url(#arrow-rota)';
      }
      if (stroke === colorAccent) {
        return 'url(#arrow-critico)';
      }
      return 'url(#arrow)';
    };

    const larguraAresta = (a: Aresta): number => {
      const stroke = corAresta(a);
      if (stroke === colorWarn || stroke === colorAccent) {
        return 3.4;
      }
      return 1.6;
    };

    const pintarNo = (id: number, destaque: boolean) => {
      nodes
        .filter((d) => d.id === id)
        .select('circle.node-body')
        .transition()
        .duration(320)
        .attr('fill', destaque ? colorWarn : corNo(disciplinas.find((x) => x.id === id)!))
        .attr('r', selecionada === id ? 24 : destaque ? 22 : 20)
        .attr('stroke', selecionada === id ? colorInk : '#ffffff')
        .attr('stroke-width', selecionada === id ? 3 : 2.5);
    };

    const pintarAresta = (from: number, to: number) => {
      edgeSel
        .filter((a) => a.preRequisitoId === from && a.disciplinaId === to)
        .transition()
        .duration(380)
        .attr('stroke', colorWarn)
        .attr('stroke-width', 3.4)
        .attr('marker-end', 'url(#arrow-rota)')
        .attr('opacity', 1);
    };

    const aplicarEstadoFinal = (): void => {
      nodes.attr('opacity', (d) => (concluidas.has(d.id) ? 0.72 : 1));
      nodes
        .select('circle.node-body')
        .attr('r', (d) => (selecionada === d.id ? 24 : 20))
        .attr('fill', (d) => corNo(d))
        .attr('stroke', (d) => (selecionada === d.id ? colorInk : '#ffffff'))
        .attr('stroke-width', (d) => (selecionada === d.id ? 3 : 2.5));
      nodes
        .select('circle.node-halo')
        .attr('opacity', (d) => (ofertadas.has(d.id) && !concluidas.has(d.id) ? 0.95 : 0));
      nodes.selectAll('text').attr('opacity', 1);
      edgeSel
        .attr('opacity', (a) =>
          concluidas.has(a.preRequisitoId) && concluidas.has(a.disciplinaId) ? 0.35 : 0.9,
        )
        .attr('stroke', (a) => corAresta(a))
        .attr('stroke-width', (a) => larguraAresta(a))
        .attr('marker-end', (a) => markerAresta(a));
    };

    if (animarRota) {
      nodes.attr('opacity', (d) => (concluidas.has(d.id) ? 0.72 : 1));
      nodes.select('circle.node-body').attr('r', 20).attr('fill', (d) => corNo(d));
      nodes
        .select('circle.node-halo')
        .attr('opacity', (d) => (ofertadas.has(d.id) && !concluidas.has(d.id) ? 0.95 : 0));
      nodes.selectAll('text').attr('opacity', 1);
      edgeSel
        .attr('opacity', 0.85)
        .attr('stroke', colorBorder)
        .attr('stroke-width', 1.6)
        .attr('marker-end', 'url(#arrow)');

      // Mostra crítico base primeiro
      edgeSel
        .filter((a) => isArestaCritica(a))
        .attr('stroke', colorAccent)
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrow-critico)');
      nodes
        .filter((d) => criticos.has(d.id) && !concluidas.has(d.id))
        .select('circle.node-body')
        .attr('fill', colorAccent);

      const passoMs = 480;
      rotaOrdem.forEach((id, i) => {
        this.agendar(() => pintarNo(id, true), i * passoMs);
        if (i < rotaOrdem.length - 1) {
          const next = rotaOrdem[i + 1]!;
          this.agendar(() => pintarAresta(id, next), i * passoMs + 200);
        }
      });
      return;
    }

    if (!animarGrafo) {
      aplicarEstadoFinal();
      return;
    }

    const porSemestre = new Map<number, Disciplina[]>();
    for (const d of disciplinas) {
      const lista = porSemestre.get(d.semestreSugerido) ?? [];
      lista.push(d);
      porSemestre.set(d.semestreSugerido, lista);
    }
    const delayColuna = 360;

    semestres.forEach((sem, i) => {
      const ids = new Set((porSemestre.get(sem) ?? []).map((d) => d.id));
      this.agendar(() => {
        nodes
          .filter((d) => ids.has(d.id))
          .transition()
          .duration(400)
          .attr('opacity', (d) => (concluidas.has(d.id) ? 0.72 : 1))
          .select('circle.node-body')
          .attr('r', 20)
          .attr('fill', (d) => corNo(d));

        nodes
          .filter((d) => ids.has(d.id))
          .selectAll('text')
          .transition()
          .duration(280)
          .attr('opacity', 1);

        nodes
          .filter((d) => ids.has(d.id))
          .select('circle.node-halo')
          .transition()
          .duration(280)
          .attr('opacity', (d) => (ofertadas.has(d.id) && !concluidas.has(d.id) ? 0.95 : 0));
      }, i * delayColuna);
    });

    const tArestas = semestres.length * delayColuna + 100;
    this.agendar(() => {
      edgeSel.transition().duration(480).attr('opacity', 0.9);
    }, tArestas);

    const tCritico = tArestas + 480;
    this.agendar(() => aplicarEstadoFinal(), tCritico);
  }
}
