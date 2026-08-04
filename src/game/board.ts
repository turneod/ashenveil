// Tahtayı kurar: geometriyi üretir, arazi türlerini, zar jetonlarını ve limanları dağıtır.

import type { Geometry } from './geometry';
import { buildGeometry } from './geometry';
import type { TerrainType, PortType } from './types';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Klasik Catan dağılımı: 4 orman, 4 otlak, 4 tarla, 3 ocak, 3 dağ, 1 çöl = 19
const TERRAIN_BAG: TerrainType[] = [
  'odun', 'odun', 'odun', 'odun',
  'yun', 'yun', 'yun', 'yun',
  'bugday', 'bugday', 'bugday', 'bugday',
  'tugla', 'tugla', 'tugla',
  'tas', 'tas', 'tas',
  'col',
];

// 18 çöl-olmayan karo için zar jetonları (7 yok).
const TOKEN_BAG = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

// 9 liman: 4 genel (3:1) + her kaynaktan bir 2:1
const PORT_BAG: PortType[] = ['genel', 'genel', 'genel', 'genel', 'odun', 'tugla', 'yun', 'bugday', 'tas'];

/** Yeni bir tahta üretir (geometri + rastgele arazi/jeton/liman dağılımı). Robber tile id döner. */
export function buildBoard(): { geo: Geometry; robber: number } {
  const geo = buildGeometry();

  // Arazileri dağıt
  const terrains = shuffle(TERRAIN_BAG);
  geo.tiles.forEach((t, i) => {
    t.terrain = terrains[i];
  });

  // Jetonları çöl-olmayan karolara dağıt
  const tokens = shuffle(TOKEN_BAG);
  let ti = 0;
  let robber = 0;
  for (const t of geo.tiles) {
    if (t.terrain === 'col') {
      t.token = null;
      robber = t.id; // kervancı çölde başlar
    } else {
      t.token = tokens[ti++];
    }
  }

  // Limanları kıyı kenarlarına dağıt (yaklaşık eşit aralıklı)
  assignPorts(geo);

  return { geo, robber };
}

function assignPorts(geo: Geometry): void {
  // Kıyı kenarları: tek bir karoya ait olanlar
  const perimeter = geo.edges.filter((e) => e.tiles.length === 1);
  // Tahtanın merkezi (0,0) etrafında açıya göre sırala
  perimeter.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

  const ports = shuffle(PORT_BAG);
  const step = perimeter.length / ports.length;
  for (let i = 0; i < ports.length; i++) {
    const edge = perimeter[Math.floor(i * step)];
    geo.vertices[edge.a].port = ports[i];
    geo.vertices[edge.b].port = ports[i];
  }
}
