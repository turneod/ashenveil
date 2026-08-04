// 19-altıgen tahtanın geometrisini üretir: karolar, köşeler (vertex) ve kenarlar (edge).
// Yaklaşım: her altıgenin köşe piksellerini hesapla, yakın noktaları birleştir (dedup).
// Böylece köşe/kenar grafiği güvenilir biçimde ortaya çıkar (54 köşe, 72 kenar, 19 karo).

import type { Tile, Vertex, Edge } from './types';

export interface Geometry {
  tiles: Tile[];
  vertices: Vertex[];
  edges: Edge[];
}

const SIZE = 54; // altıgen merkez-köşe yarıçapı (piksel)

/** Pointy-top altıgenin eksenel (q,r) koordinatından piksel merkezi. */
function hexCenter(q: number, r: number): { cx: number; cy: number } {
  return {
    cx: SIZE * Math.sqrt(3) * (q + r / 2),
    cy: SIZE * 1.5 * r,
  };
}

/** Bir altıgenin 6 köşesinin piksel konumu (pointy-top). */
function hexCorners(cx: number, cy: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k < 6; k++) {
    const angle = (Math.PI / 180) * (60 * k - 30);
    pts.push({ x: cx + SIZE * Math.cos(angle), y: cy + SIZE * Math.sin(angle) });
  }
  return pts;
}

const key = (x: number, y: number) => `${Math.round(x)}_${Math.round(y)}`;

export function buildGeometry(): Geometry {
  const tiles: Tile[] = [];
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];

  const vertexByKey = new Map<string, number>(); // konum anahtarı -> vertex id
  const edgeByKey = new Map<string, number>(); // "a-b" -> edge id

  const getVertex = (x: number, y: number): number => {
    const k = key(x, y);
    const existing = vertexByKey.get(k);
    if (existing !== undefined) return existing;
    const id = vertices.length;
    vertices.push({ id, x, y, tiles: [], neighbors: [], edges: [], port: null });
    vertexByKey.set(k, id);
    return id;
  };

  const getEdge = (a: number, b: number): number => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const k = `${lo}-${hi}`;
    const existing = edgeByKey.get(k);
    if (existing !== undefined) return existing;
    const id = edges.length;
    const va = vertices[lo];
    const vb = vertices[hi];
    edges.push({ id, a: lo, b: hi, x: (va.x + vb.x) / 2, y: (va.y + vb.y) / 2, tiles: [] });
    edgeByKey.set(k, id);
    // komşuluk grafiği
    va.neighbors.push(hi);
    vb.neighbors.push(lo);
    va.edges.push(id);
    vb.edges.push(id);
    return id;
  };

  // Yarıçapı 2 olan altıgen dizilişi (|q|,|r|,|q+r| <= 2) => 19 karo
  for (let r = -2; r <= 2; r++) {
    for (let q = -2; q <= 2; q++) {
      if (Math.abs(q + r) > 2) continue;
      const { cx, cy } = hexCenter(q, r);
      const cornerPts = hexCorners(cx, cy);
      const cornerIds = cornerPts.map((p) => getVertex(p.x, p.y));
      const tileId = tiles.length;
      tiles.push({ id: tileId, q, r, cx, cy, terrain: 'col', token: null, corners: cornerIds });
      for (let k = 0; k < 6; k++) {
        const vId = cornerIds[k];
        if (!vertices[vId].tiles.includes(tileId)) vertices[vId].tiles.push(tileId);
        const edgeId = getEdge(cornerIds[k], cornerIds[(k + 1) % 6]);
        if (!edges[edgeId].tiles.includes(tileId)) edges[edgeId].tiles.push(tileId);
      }
    }
  }

  return { tiles, vertices, edges };
}
