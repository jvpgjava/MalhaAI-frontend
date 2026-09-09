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
  readonly selecionadaId = input<number | null>(null);
  /** Revela colunas → arestas → caminho crítico (tela do grafo). */
  readonly animar = input(true);
  /** Acende a rota buscada nó a nó / aresta a aresta (tela eletiva). */
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
      const selecionada = this.selecionadaId();
      const animar = this.animar();
      const animarRota = this.animarRota();

      const signature = [
        disciplinas.map((d) => d.id).join(','),
        arestas.map((a) => `${a.preRequisitoId}->${a.disciplinaId}`).join(','),
        criticos.join(','),
        rota.join(','),
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

    const layout = calcularLayoutGrafo(disciplinas);
    const byId = new Map(layout.map((p) => [p.id, p]));
    const rota = new Set(rotaOrdem);

    const maxX = Math.max(...layout.map((p) => p.x)) + 120;
    const maxY = Math.max(...layout.map((p) => p.y)) + 80;
    const width = Math.max(maxX, 640);
    const height = Math.max(maxY, 360);

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const styles = getComputedStyle(document.documentElement);
    const colorAccent = styles.getPropertyValue('--color-accent').trim() || '#e8366d';
    const colorTeal = styles.getPropertyValue('--color-teal').trim() || '#1a7a8a';
    const colorBorder = styles.getPropertyValue('--color-border').trim() || '#e2e8f0';
    const colorInk = styles.getPropertyValue('--color-ink').trim() || '#1e2761';
    const colorWarn = styles.getPropertyValue('--color-warn').trim() || '#e8914b';

    const g = svg.append('g');
    const defs = svg.append('defs');

    const addMarker = (id: string, fill: string) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 18)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', fill);
    };
    addMarker('arrow', colorBorder);
    addMarker('arrow-rota', colorWarn);

    const arestasValidas = arestas.filter(
      (a) => byId.has(a.preRequisitoId) && byId.has(a.disciplinaId),
    );

    const esconderInicial = animarGrafo;
    const edgeSel = g
      .selectAll('line.edge')
      .data(arestasValidas)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('x1', (a) => byId.get(a.preRequisitoId)!.x)
      .attr('y1', (a) => byId.get(a.preRequisitoId)!.y)
      .attr('x2', (a) => byId.get(a.disciplinaId)!.x)
      .attr('y2', (a) => byId.get(a.disciplinaId)!.y)
      .attr('stroke', colorBorder)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)')
      .attr('opacity', esconderInicial ? 0 : 1);

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
      .attr('r', esconderInicial ? 0 : 18)
      .attr('fill', colorTeal)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    nodes
      .append('text')
      .attr('class', 'node-code')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('opacity', esconderInicial ? 0 : 1)
      .text((d) => (d.nome.length <= 8 ? d.nome : `${d.nome.slice(0, 7)}…`));

    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', 34)
      .attr('fill', colorInk)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('opacity', esconderInicial ? 0 : 1)
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

    const corNo = (d: Disciplina): string => {
      if (rota.has(d.id)) {
        return colorWarn;
      }
      return criticos.has(d.id) ? colorAccent : colorTeal;
    };

    const isArestaRota = (a: Aresta, ateIndice: number): boolean => {
      for (let i = 0; i < ateIndice; i++) {
        if (rotaOrdem[i] === a.preRequisitoId && rotaOrdem[i + 1] === a.disciplinaId) {
          return true;
        }
      }
      return false;
    };

    const corAresta = (a: Aresta): string => {
      if (rota.has(a.preRequisitoId) && rota.has(a.disciplinaId) && isArestaRota(a, rotaOrdem.length - 1)) {
        return colorWarn;
      }
      if (criticos.has(a.preRequisitoId) && criticos.has(a.disciplinaId)) {
        return colorAccent;
      }
      return colorBorder;
    };

    const larguraAresta = (a: Aresta): number => {
      const destaque =
        (rota.has(a.preRequisitoId) && rota.has(a.disciplinaId) && isArestaRota(a, rotaOrdem.length - 1)) ||
        (criticos.has(a.preRequisitoId) && criticos.has(a.disciplinaId));
      return destaque ? 3.5 : 1.5;
    };

    const pintarNo = (id: number, destaque: boolean) => {
      nodes
        .filter((d) => d.id === id)
        .select('circle')
        .transition()
        .duration(320)
        .attr('fill', destaque ? colorWarn : colorTeal)
        .attr('r', selecionada === id ? 22 : destaque ? 20 : 18)
        .attr('stroke', selecionada === id ? colorInk : '#ffffff')
        .attr('stroke-width', selecionada === id ? 3 : 2);
    };

    const pintarAresta = (from: number, to: number) => {
      edgeSel
        .filter((a) => a.preRequisitoId === from && a.disciplinaId === to)
        .transition()
        .duration(380)
        .attr('stroke', colorWarn)
        .attr('stroke-width', 3.5)
        .attr('marker-end', 'url(#arrow-rota)');
    };

    const aplicarEstadoFinal = (): void => {
      nodes.attr('opacity', 1);
      nodes
        .select('circle')
        .attr('r', (d) => (selecionada === d.id ? 22 : 18))
        .attr('fill', (d) => corNo(d))
        .attr('stroke', (d) => (selecionada === d.id ? colorInk : '#ffffff'))
        .attr('stroke-width', (d) => (selecionada === d.id ? 3 : 2));
      nodes.selectAll('text').attr('opacity', 1);
      edgeSel
        .attr('opacity', 1)
        .attr('stroke', (a) => corAresta(a))
        .attr('stroke-width', (a) => larguraAresta(a))
        .attr('marker-end', (a) =>
          corAresta(a) === colorWarn ? 'url(#arrow-rota)' : 'url(#arrow)',
        );
    };

    if (animarRota) {
      // Grafo base já visível; trajeto acende aos poucos
      nodes.attr('opacity', 1);
      nodes.select('circle').attr('r', 18).attr('fill', colorTeal);
      nodes.selectAll('text').attr('opacity', 1);
      edgeSel.attr('opacity', 1).attr('stroke', colorBorder).attr('stroke-width', 1.5);

      const passoMs = 520;
      rotaOrdem.forEach((id, i) => {
        this.agendar(() => pintarNo(id, true), i * passoMs);
        if (i < rotaOrdem.length - 1) {
          const next = rotaOrdem[i + 1]!;
          this.agendar(() => pintarAresta(id, next), i * passoMs + 220);
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
    const semestres = [...porSemestre.keys()].sort((a, b) => a - b);
    const delayColuna = 380;

    semestres.forEach((sem, i) => {
      const ids = new Set((porSemestre.get(sem) ?? []).map((d) => d.id));
      this.agendar(() => {
        nodes
          .filter((d) => ids.has(d.id))
          .transition()
          .duration(420)
          .attr('opacity', 1)
          .select('circle')
          .attr('r', 18)
          .attr('fill', colorTeal);

        nodes
          .filter((d) => ids.has(d.id))
          .selectAll('text')
          .transition()
          .duration(320)
          .attr('opacity', 1);
      }, i * delayColuna);
    });

    const tArestas = semestres.length * delayColuna + 120;
    this.agendar(() => {
      edgeSel.transition().duration(500).attr('opacity', 1);
    }, tArestas);

    const tCritico = tArestas + 520;
    this.agendar(() => {
      nodes
        .select('circle')
        .transition()
        .duration(480)
        .attr('fill', (d) => corNo(d))
        .attr('r', (d) => (selecionada === d.id ? 22 : 18))
        .attr('stroke', (d) => (selecionada === d.id ? colorInk : '#ffffff'))
        .attr('stroke-width', (d) => (selecionada === d.id ? 3 : 2));

      edgeSel
        .transition()
        .duration(480)
        .attr('stroke', (a) => corAresta(a))
        .attr('stroke-width', (a) => larguraAresta(a))
        .attr('marker-end', (a) =>
          corAresta(a) === colorWarn ? 'url(#arrow-rota)' : 'url(#arrow)',
        );
    }, tCritico);
  }
}
