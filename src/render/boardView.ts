// Tahtanın SVG çizimi: altıgenler, jetonlar, limanlar, yollar, köyler/şehirler, kervancı
// ve etkileşim katmanı (yasal köşe/kenar/karo tıklamaları).

import type { GameState } from '../game/types';
import { TERRAIN_RENK, TERRAIN_AD, portEtiket } from '../i18n';

const SVGNS = 'http://www.w3.org/2000/svg';

export interface BoardHandlers {
  legalVertices?: Set<number>;
  legalEdges?: Set<number>;
  legalTiles?: boolean; // kervancı: mevcut karo hariç tümü tıklanabilir
  onVertex?: (id: number) => void;
  onEdge?: (id: number) => void;
  onTile?: (id: number) => void;
}

function el(name: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export function renderBoard(state: GameState, h: BoardHandlers): SVGSVGElement {
  // viewBox: köşelerin sınırlarından + boşluk
  const xs = state.vertices.map((v) => v.x);
  const ys = state.vertices.map((v) => v.y);
  const pad = 46;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad;
  const hgt = Math.max(...ys) - minY + pad;

  const svg = el('svg', {
    viewBox: `${minX} ${minY} ${w} ${hgt}`,
    class: 'board',
    preserveAspectRatio: 'xMidYMid meet',
  }) as SVGSVGElement;

  // ---- Karolar + jetonlar ----
  for (const t of state.tiles) {
    const pts = t.corners.map((c) => `${state.vertices[c].x},${state.vertices[c].y}`).join(' ');
    const hex = el('polygon', {
      points: pts,
      fill: TERRAIN_RENK[t.terrain],
      stroke: '#7a5c2e',
      'stroke-width': 2,
      class: 'hex',
    });
    hex.appendChild(titleEl(TERRAIN_AD[t.terrain] + (t.token ? ` (${t.token})` : '')));
    if (h.legalTiles && t.id !== state.robber) {
      hex.classList.add('clickable-tile');
      hex.addEventListener('click', () => h.onTile?.(t.id));
    }
    svg.appendChild(hex);

    if (t.token !== null) {
      const hot = t.token === 6 || t.token === 8;
      svg.appendChild(el('circle', {
        cx: t.cx, cy: t.cy, r: 17, fill: '#f3ecd8', stroke: '#7a5c2e', 'stroke-width': 1.5,
      }));
      const txt = el('text', {
        x: t.cx, y: t.cy, class: 'token', fill: hot ? '#c0392b' : '#333',
        'font-weight': hot ? '800' : '700',
      });
      txt.textContent = String(t.token);
      svg.appendChild(txt);
    }
  }

  // ---- Limanlar ----
  drawPorts(svg, state);

  // ---- Yollar ----
  for (const [edgeIdStr, owner] of Object.entries(state.roads)) {
    const e = state.edges[Number(edgeIdStr)];
    const va = state.vertices[e.a];
    const vb = state.vertices[e.b];
    svg.appendChild(el('line', {
      x1: va.x, y1: va.y, x2: vb.x, y2: vb.y,
      stroke: state.players[owner].color, 'stroke-width': 9, 'stroke-linecap': 'round', class: 'road',
    }));
  }

  // ---- Kenar etkileşimi (yol yeri) ----
  if (h.legalEdges) {
    for (const id of h.legalEdges) {
      const e = state.edges[id];
      const va = state.vertices[e.a];
      const vb = state.vertices[e.b];
      const hit = el('line', {
        x1: va.x, y1: va.y, x2: vb.x, y2: vb.y,
        stroke: state.players[state.current].color, 'stroke-width': 9,
        'stroke-linecap': 'round', class: 'legal-edge',
      });
      hit.addEventListener('click', () => h.onEdge?.(id));
      svg.appendChild(hit);
    }
  }

  // ---- Binalar ----
  for (const [vidStr, b] of Object.entries(state.buildings)) {
    const v = state.vertices[Number(vidStr)];
    svg.appendChild(buildingShape(v.x, v.y, b.type, state.players[b.owner].color));
  }

  // ---- Kervancı ----
  const rob = state.tiles[state.robber];
  svg.appendChild(el('circle', {
    cx: rob.cx, cy: rob.cy + 24, r: 11, fill: '#2b2b2b', stroke: '#fff', 'stroke-width': 2, class: 'robber',
  }));

  // ---- Köşe etkileşimi (köy/şehir yeri) ----
  if (h.legalVertices) {
    for (const id of h.legalVertices) {
      const v = state.vertices[id];
      const dot = el('circle', {
        cx: v.x, cy: v.y, r: 11, fill: state.players[state.current].color,
        stroke: '#fff', 'stroke-width': 2, class: 'legal-vertex',
      });
      dot.addEventListener('click', () => h.onVertex?.(id));
      svg.appendChild(dot);
    }
  }

  return svg;
}

function titleEl(text: string): SVGElement {
  const t = el('title', {});
  t.textContent = text;
  return t;
}

function buildingShape(x: number, y: number, type: 'koy' | 'sehir', color: string): SVGElement {
  const g = el('g', { class: 'building' });
  if (type === 'koy') {
    const house = el('path', {
      d: `M ${x - 8} ${y + 6} L ${x - 8} ${y - 2} L ${x} ${y - 9} L ${x + 8} ${y - 2} L ${x + 8} ${y + 6} Z`,
      fill: color, stroke: '#1c1c1c', 'stroke-width': 1.8, 'stroke-linejoin': 'round',
    });
    g.appendChild(house);
  } else {
    const city = el('path', {
      d: `M ${x - 12} ${y + 7} L ${x - 12} ${y - 2} L ${x - 4} ${y - 9} L ${x + 3} ${y - 2} L ${x + 3} ${y - 5} L ${x + 12} ${y - 5} L ${x + 12} ${y + 7} Z`,
      fill: color, stroke: '#1c1c1c', 'stroke-width': 1.8, 'stroke-linejoin': 'round',
    });
    g.appendChild(city);
  }
  return g;
}

function drawPorts(svg: SVGSVGElement, state: GameState): void {
  for (const e of state.edges) {
    if (e.tiles.length !== 1) continue;
    const pa = state.vertices[e.a].port;
    const pb = state.vertices[e.b].port;
    if (!pa || pa !== pb) continue;
    // orta noktadan dışarı doğru itele
    const len = Math.hypot(e.x, e.y) || 1;
    const ox = e.x + (e.x / len) * 26;
    const oy = e.y + (e.y / len) * 26;
    svg.appendChild(el('line', {
      x1: e.x, y1: e.y, x2: ox, y2: oy, stroke: '#3a6ea5', 'stroke-width': 2, 'stroke-dasharray': '3 2',
    }));
    svg.appendChild(el('circle', { cx: ox, cy: oy, r: 13, fill: '#dceaf7', stroke: '#3a6ea5', 'stroke-width': 1.5 }));
    const txt = el('text', { x: ox, y: oy, class: 'port', fill: '#1c3d5a' });
    txt.textContent = portEtiket(pa);
    svg.appendChild(txt);
  }
}
