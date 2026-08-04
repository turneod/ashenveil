// Tahtanın SVG çizimi — canlı & dokulu illüstrasyon:
// deniz zemini, gölge düşüren ada, gradyanlı araziler + arazi motifleri (ağaç, dağ, koyun,
// buğday, tuğla, çöl), olasılık noktalı jetonlar, evler/şehirler, kervancı ve limanlar.

import type { GameState, TerrainType } from '../game/types';
import { portEtiket } from '../i18n';

const SVGNS = 'http://www.w3.org/2000/svg';

export interface BoardHandlers {
  legalVertices?: Set<number>;
  legalEdges?: Set<number>;
  legalTiles?: boolean;
  onVertex?: (id: number) => void;
  onEdge?: (id: number) => void;
  onTile?: (id: number) => void;
}

function el(name: string, attrs: Record<string, string | number> = {}): SVGElement {
  const e = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

const DEFS = `
  <linearGradient id="g-odun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#48a457"/><stop offset="1" stop-color="#236a2c"/></linearGradient>
  <linearGradient id="g-tugla" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#dd7644"/><stop offset="1" stop-color="#a2401d"/></linearGradient>
  <linearGradient id="g-yun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9fd267"/><stop offset="1" stop-color="#69a53c"/></linearGradient>
  <linearGradient id="g-bugday" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f6d15c"/><stop offset="1" stop-color="#d7a12c"/></linearGradient>
  <linearGradient id="g-tas" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a2aeb9"/><stop offset="1" stop-color="#68757f"/></linearGradient>
  <linearGradient id="g-col" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#eeda9d"/><stop offset="1" stop-color="#d6ba72"/></linearGradient>
  <linearGradient id="g-sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4aa0d4"/><stop offset="1" stop-color="#1d608f"/></linearGradient>
  <radialGradient id="g-token" cx="0.4" cy="0.35" r="0.8">
    <stop offset="0" stop-color="#fff8e6"/><stop offset="1" stop-color="#ecd9ab"/></radialGradient>
  <filter id="f-shadow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="1.4" stdDeviation="1.1" flood-color="#000" flood-opacity="0.35"/></filter>
  <filter id="f-island" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#0b2c42" flood-opacity="0.4"/></filter>`;

const GRAD: Record<TerrainType, string> = {
  odun: 'url(#g-odun)', tugla: 'url(#g-tugla)', yun: 'url(#g-yun)',
  bugday: 'url(#g-bugday)', tas: 'url(#g-tas)', col: 'url(#g-col)',
};

export function renderBoard(state: GameState, h: BoardHandlers): SVGSVGElement {
  const xs = state.vertices.map((v) => v.x);
  const ys = state.vertices.map((v) => v.y);
  const pad = 72;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad;
  const hgt = Math.max(...ys) - minY + pad;

  const svg = el('svg', {
    viewBox: `${minX} ${minY} ${w} ${hgt}`, class: 'board', preserveAspectRatio: 'xMidYMid meet',
  }) as SVGSVGElement;

  const defs = el('defs');
  defs.innerHTML = DEFS;
  svg.appendChild(defs);

  // ---- Deniz zemini + dalgalar ----
  svg.appendChild(el('rect', { x: minX, y: minY, width: w, height: hgt, fill: 'url(#g-sea)' }));
  drawWaves(svg, minX, minY, w, hgt);

  // ---- Ada (gölge düşen karo grubu) ----
  const island = el('g', { filter: 'url(#f-island)' });
  for (const t of state.tiles) {
    const pts = t.corners.map((c) => `${state.vertices[c].x},${state.vertices[c].y}`).join(' ');
    const hex = el('polygon', {
      points: pts, fill: GRAD[t.terrain], stroke: '#6b4a24', 'stroke-width': 2.5,
      'stroke-linejoin': 'round', class: 'hex',
    });
    if (h.legalTiles && t.id !== state.robber) {
      hex.classList.add('clickable-tile');
      hex.addEventListener('click', () => h.onTile?.(t.id));
    }
    island.appendChild(hex);
  }
  svg.appendChild(island);

  // ---- Arazi motifleri ----
  const decor = el('g', { class: 'decor' });
  for (const t of state.tiles) decorate(decor, t.terrain, t.cx, t.cy);
  svg.appendChild(decor);

  // ---- Limanlar ----
  drawPorts(svg, state);

  // ---- Sayı jetonları ----
  const tokens = el('g', { filter: 'url(#f-shadow)' });
  for (const t of state.tiles) {
    if (t.token === null) continue;
    const hot = t.token === 6 || t.token === 8;
    tokens.appendChild(el('circle', { cx: t.cx, cy: t.cy, r: 18, fill: 'url(#g-token)', stroke: '#7a5c2e', 'stroke-width': 1.5 }));
    const txt = el('text', { x: t.cx, y: t.cy - 3, class: 'token', fill: hot ? '#c0392b' : '#3a2f1c', 'font-weight': hot ? '800' : '700' });
    txt.textContent = String(t.token);
    tokens.appendChild(txt);
    drawPips(tokens, t.cx, t.cy + 9, t.token, hot);
  }
  svg.appendChild(tokens);

  // ---- Yollar ----
  for (const [edgeIdStr, owner] of Object.entries(state.roads)) {
    const e = state.edges[Number(edgeIdStr)];
    const va = state.vertices[e.a];
    const vb = state.vertices[e.b];
    svg.appendChild(el('line', { x1: va.x, y1: va.y, x2: vb.x, y2: vb.y, stroke: '#1c1c1c', 'stroke-width': 12, 'stroke-linecap': 'round' }));
    svg.appendChild(el('line', { x1: va.x, y1: va.y, x2: vb.x, y2: vb.y, stroke: state.players[owner].color, 'stroke-width': 7, 'stroke-linecap': 'round', class: 'road' }));
  }

  // ---- Yol yeri (etkileşim) ----
  if (h.legalEdges) {
    for (const id of h.legalEdges) {
      const e = state.edges[id];
      const va = state.vertices[e.a];
      const vb = state.vertices[e.b];
      const hit = el('line', { x1: va.x, y1: va.y, x2: vb.x, y2: vb.y, stroke: state.players[state.current].color, 'stroke-width': 9, 'stroke-linecap': 'round', class: 'legal-edge' });
      hit.addEventListener('click', () => h.onEdge?.(id));
      svg.appendChild(hit);
    }
  }

  // ---- Binalar ----
  const builds = el('g', { filter: 'url(#f-shadow)' });
  for (const [vidStr, b] of Object.entries(state.buildings)) {
    const v = state.vertices[Number(vidStr)];
    builds.appendChild(buildingShape(v.x, v.y, b.type, state.players[b.owner].color));
  }
  svg.appendChild(builds);

  // ---- Kervancı ----
  const rob = state.tiles[state.robber];
  svg.appendChild(robberShape(rob.cx, rob.cy + 20));

  // ---- Köy/şehir yeri (etkileşim) ----
  if (h.legalVertices) {
    for (const id of h.legalVertices) {
      const v = state.vertices[id];
      const dot = el('circle', { cx: v.x, cy: v.y, r: 11, fill: state.players[state.current].color, stroke: '#fff', 'stroke-width': 2.5, class: 'legal-vertex' });
      dot.addEventListener('click', () => h.onVertex?.(id));
      svg.appendChild(dot);
    }
  }

  return svg;
}

// ---------- Yardımcılar ----------

function drawWaves(svg: SVGSVGElement, x: number, y: number, w: number, hh: number): void {
  const g = el('g', { class: 'waves', fill: 'none', stroke: '#ffffff', 'stroke-opacity': '0.14', 'stroke-width': '2', 'stroke-linecap': 'round' });
  for (let i = 0; i < 22; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * hh;
    g.appendChild(el('path', { d: `M ${px} ${py} q 6 -5 12 0 q 6 5 12 0` }));
  }
  svg.appendChild(g);
}

function drawPips(g: SVGElement, cx: number, cy: number, token: number, hot: boolean): void {
  const n = 6 - Math.abs(7 - token); // olasılık noktaları
  const gap = 4;
  const start = cx - ((n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) {
    g.appendChild(el('circle', { cx: start + i * gap, cy, r: 1.5, fill: hot ? '#c0392b' : '#6b5a3c' }));
  }
}

function decorate(g: SVGElement, terrain: TerrainType, cx: number, cy: number): void {
  switch (terrain) {
    case 'odun':
      pine(g, cx - 20, cy - 8); pine(g, cx + 18, cy - 14); pine(g, cx + 4, cy + 20);
      break;
    case 'tas':
      peak(g, cx - 14, cy + 14, 20); peak(g, cx + 12, cy + 16, 26);
      break;
    case 'yun':
      sheep(g, cx - 16, cy + 16); tuft(g, cx + 16, cy - 12); tuft(g, cx + 20, cy + 16);
      break;
    case 'bugday':
      wheat(g, cx - 20, cy + 18); wheat(g, cx - 8, cy + 20); wheat(g, cx + 16, cy + 18); wheat(g, cx + 28, cy + 20);
      break;
    case 'tugla':
      bricks(g, cx - 24, cy + 8); bricks(g, cx - 24, cy + 17);
      break;
    case 'col':
      dune(g, cx - 22, cy + 18); dune(g, cx + 6, cy + 20); cactus(g, cx + 20, cy - 6);
      break;
  }
}

function pine(g: SVGElement, x: number, y: number): void {
  g.appendChild(el('rect', { x: x - 1.5, y: y + 8, width: 3, height: 6, fill: '#6b4a24' }));
  g.appendChild(el('polygon', { points: `${x},${y - 10} ${x - 8},${y + 2} ${x + 8},${y + 2}`, fill: '#1f6b2c' }));
  g.appendChild(el('polygon', { points: `${x},${y - 4} ${x - 7},${y + 9} ${x + 7},${y + 9}`, fill: '#28873a' }));
}

function peak(g: SVGElement, x: number, y: number, s: number): void {
  g.appendChild(el('polygon', { points: `${x},${y - s} ${x - s * 0.7},${y} ${x + s * 0.7},${y}`, fill: '#5c6772' }));
  g.appendChild(el('polygon', { points: `${x},${y - s} ${x - s * 0.24},${y - s * 0.6} ${x + s * 0.24},${y - s * 0.6}`, fill: '#f2f5f7' }));
}

function sheep(g: SVGElement, x: number, y: number): void {
  g.appendChild(el('ellipse', { cx: x, cy: y, rx: 8, ry: 6, fill: '#f7f6f2', stroke: '#cfc9ba', 'stroke-width': 1 }));
  g.appendChild(el('circle', { cx: x + 7, cy: y - 2, r: 3.4, fill: '#4a4038' }));
}

function tuft(g: SVGElement, x: number, y: number): void {
  g.appendChild(el('path', { d: `M ${x - 4} ${y} q 2 -7 4 0 M ${x} ${y} q 2 -8 4 0 M ${x + 4} ${y} q 2 -7 4 0`, stroke: '#3f7d2a', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }));
}

function wheat(g: SVGElement, x: number, y: number): void {
  g.appendChild(el('line', { x1: x, y1: y, x2: x, y2: y - 14, stroke: '#b9862a', 'stroke-width': 1.6 }));
  for (const dy of [0, 4, 8]) {
    g.appendChild(el('path', { d: `M ${x} ${y - 14 + dy} l -3 -3 M ${x} ${y - 14 + dy} l 3 -3`, stroke: '#e6b84a', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
  }
}

function bricks(g: SVGElement, x: number, y: number): void {
  const off = (y % 2 === 0) ? 0 : 5;
  for (let i = 0; i < 5; i++) {
    g.appendChild(el('rect', { x: x + off + i * 10, y, width: 9, height: 7, rx: 1, fill: '#b34a24', stroke: '#7d3016', 'stroke-width': 0.8 }));
  }
}

function dune(g: SVGElement, x: number, y: number): void {
  g.appendChild(el('path', { d: `M ${x} ${y} q 10 -8 20 0`, stroke: '#c6a75d', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));
}

function cactus(g: SVGElement, x: number, y: number): void {
  g.appendChild(el('path', { d: `M ${x} ${y + 12} L ${x} ${y - 6} M ${x} ${y + 2} q -6 0 -6 -6 M ${x} ${y + 5} q 6 0 6 -6`, stroke: '#3f8a52', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
}

function buildingShape(x: number, y: number, type: 'koy' | 'sehir', color: string): SVGElement {
  const g = el('g', { class: 'building' });
  if (type === 'koy') {
    g.appendChild(el('rect', { x: x - 8, y: y - 2, width: 16, height: 9, fill: color, stroke: '#1c1c1c', 'stroke-width': 1.6 }));
    g.appendChild(el('polygon', { points: `${x - 10},${y - 2} ${x},${y - 11} ${x + 10},${y - 2}`, fill: color, stroke: '#1c1c1c', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }));
    g.appendChild(el('polygon', { points: `${x - 10},${y - 2} ${x},${y - 11} ${x + 10},${y - 2}`, fill: 'rgba(0,0,0,0.18)' }));
    g.appendChild(el('rect', { x: x - 2.2, y: y + 1, width: 4.4, height: 6, fill: 'rgba(0,0,0,0.4)' }));
  } else {
    g.appendChild(el('rect', { x: x - 12, y: y - 1, width: 14, height: 10, fill: color, stroke: '#1c1c1c', 'stroke-width': 1.6 }));
    g.appendChild(el('rect', { x: x + 1, y: y - 8, width: 10, height: 17, fill: color, stroke: '#1c1c1c', 'stroke-width': 1.6 }));
    g.appendChild(el('rect', { x: x + 1, y: y - 8, width: 10, height: 5, fill: 'rgba(0,0,0,0.2)' }));
    g.appendChild(el('polygon', { points: `${x + 6},${y - 8} ${x + 6},${y - 15} ${x + 13},${y - 12} ${x + 6},${y - 11}`, fill: '#ffd34d', stroke: '#1c1c1c', 'stroke-width': 1 }));
    g.appendChild(el('rect', { x: x - 8, y: y + 2, width: 5, height: 7, fill: 'rgba(0,0,0,0.4)' }));
  }
  return g;
}

function robberShape(cx: number, cy: number): SVGElement {
  const g = el('g', { filter: 'url(#f-shadow)', class: 'robber' });
  g.appendChild(el('path', { d: `M ${cx} ${cy - 12} q 9 0 8 14 l -16 0 q -1 -14 8 -14 Z`, fill: '#2b2b2b' }));
  g.appendChild(el('circle', { cx, cy: cy - 10, r: 5, fill: '#3a3a3a' }));
  g.appendChild(el('circle', { cx: cx - 1.6, cy: cy - 10, r: 1.1, fill: '#d8d8d8' }));
  g.appendChild(el('circle', { cx: cx + 2.4, cy: cy - 10, r: 1.1, fill: '#d8d8d8' }));
  return g;
}

function drawPorts(svg: SVGSVGElement, state: GameState): void {
  for (const e of state.edges) {
    if (e.tiles.length !== 1) continue;
    const pa = state.vertices[e.a].port;
    const pb = state.vertices[e.b].port;
    if (!pa || pa !== pb) continue;
    const len = Math.hypot(e.x, e.y) || 1;
    const ox = e.x + (e.x / len) * 28;
    const oy = e.y + (e.y / len) * 28;
    svg.appendChild(el('line', { x1: state.vertices[e.a].x, y1: state.vertices[e.a].y, x2: ox, y2: oy, stroke: '#8a5a2b', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(el('line', { x1: state.vertices[e.b].x, y1: state.vertices[e.b].y, x2: ox, y2: oy, stroke: '#8a5a2b', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(el('circle', { cx: ox, cy: oy, r: 14, fill: '#fbf3e0', stroke: '#2f6690', 'stroke-width': 2, filter: 'url(#f-shadow)' }));
    const txt = el('text', { x: ox, y: oy, class: 'port', fill: '#1c3d5a' });
    txt.textContent = portEtiket(pa);
    svg.appendChild(txt);
  }
}
