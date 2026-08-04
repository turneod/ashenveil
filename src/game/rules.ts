// Oyun kuralları: kaynak üretimi, inşaat doğrulama, takas, kervancı, en uzun yol, puan.
// Fonksiyonlar GameState üzerinde çalışır; render'dan bağımsızdır (test edilebilir).

import type { GameState, Player, Resource } from './types';
import {
  RESOURCES, KOY_PUAN, SEHIR_PUAN, EN_UZUN_YOL_PUAN, EN_UZUN_YOL_ESIK,
} from './types';

// ---- Kaynak yardımcıları ----

export function resourceCount(p: Player): number {
  return RESOURCES.reduce((s, r) => s + p.resources[r], 0);
}

export function hasResources(p: Player, cost: Partial<Record<Resource, number>>): boolean {
  return (Object.keys(cost) as Resource[]).every((r) => p.resources[r] >= (cost[r] ?? 0));
}

export function pay(p: Player, cost: Partial<Record<Resource, number>>): void {
  for (const r of Object.keys(cost) as Resource[]) p.resources[r] -= cost[r] ?? 0;
}

// ---- Bina/yol sayıları ve puan ----

export function buildingsOf(state: GameState, player: number): number[] {
  return Object.keys(state.buildings)
    .map(Number)
    .filter((v) => state.buildings[v].owner === player);
}

export function score(state: GameState, player: number): number {
  let s = 0;
  for (const v of buildingsOf(state, player)) {
    s += state.buildings[v].type === 'sehir' ? SEHIR_PUAN : KOY_PUAN;
  }
  if (state.longestRoad.owner === player) s += EN_UZUN_YOL_PUAN;
  return s;
}

// ---- Yerleştirme kuralları ----

/** Köşe boş mu ve mesafe kuralı (komşu köşede bina yok) sağlanıyor mu? */
function vertexOpenAndSpaced(state: GameState, vertexId: number): boolean {
  if (state.buildings[vertexId]) return false;
  for (const n of state.vertices[vertexId].neighbors) {
    if (state.buildings[n]) return false; // yan yana köy olamaz
  }
  return true;
}

/** Kurulum fazında köy yerleştirilebilir mi? (yalnızca boş + mesafe) */
export function canPlaceSetupSettlement(state: GameState, vertexId: number): boolean {
  return vertexOpenAndSpaced(state, vertexId);
}

/** Normal oyunda köy: boş + mesafe + oyuncunun buraya değen bir yolu olmalı. */
export function canPlaceSettlement(state: GameState, vertexId: number, player: number): boolean {
  if (!vertexOpenAndSpaced(state, vertexId)) return false;
  return state.vertices[vertexId].edges.some((e) => state.roads[e] === player);
}

export function placeSettlement(state: GameState, vertexId: number, player: number): void {
  state.buildings[vertexId] = { type: 'koy', owner: player };
}

export function canUpgradeCity(state: GameState, vertexId: number, player: number): boolean {
  const b = state.buildings[vertexId];
  return !!b && b.owner === player && b.type === 'koy';
}

export function upgradeCity(state: GameState, vertexId: number): void {
  state.buildings[vertexId].type = 'sehir';
}

/** Yol: kenar boş + kurulumda son köye değmeli, normalde oyuncunun yol/köyüne bağlı olmalı. */
export function canPlaceRoad(
  state: GameState,
  edgeId: number,
  player: number,
  setupVertex: number | null = null,
): boolean {
  if (state.roads[edgeId] !== undefined) return false;
  const edge = state.edges[edgeId];
  if (setupVertex !== null) {
    return edge.a === setupVertex || edge.b === setupVertex;
  }
  // Uçlardan biri: oyuncunun binası VEYA (rakip binası olmayan) bir ucunda oyuncunun yolu
  return [edge.a, edge.b].some((v) => {
    const b = state.buildings[v];
    if (b && b.owner === player) return true;
    if (b && b.owner !== player) return false; // rakip binasından geçilemez
    return state.vertices[v].edges.some((e) => state.roads[e] === player);
  });
}

export function placeRoad(state: GameState, edgeId: number, player: number): void {
  state.roads[edgeId] = player;
}

// ---- Üretim ----

/** Verilen zar toplamına göre kaynak üretir. Değişen oyuncu indekslerini döner (log için). */
export function produce(state: GameState, total: number): void {
  for (const tile of state.tiles) {
    if (tile.token !== total) continue;
    if (tile.id === state.robber) continue; // kervancı üretimi bloklar
    if (tile.terrain === 'col') continue;
    const res = tile.terrain;
    for (const v of tile.corners) {
      const b = state.buildings[v];
      if (!b) continue;
      state.players[b.owner].resources[res] += b.type === 'sehir' ? 2 : 1;
    }
  }
}

// ---- Takas ----

/** Bir oyuncunun bir kaynağı bankaya verme oranı (limanlara göre 4/3/2). */
export function tradeRatio(state: GameState, player: number, give: Resource): number {
  let ratio = 4;
  for (const v of buildingsOf(state, player)) {
    const port = state.vertices[v].port;
    if (port === 'genel') ratio = Math.min(ratio, 3);
    else if (port === give) ratio = Math.min(ratio, 2);
  }
  return ratio;
}

export function canBankTrade(state: GameState, player: number, give: Resource, receive: Resource): boolean {
  if (give === receive) return false;
  return state.players[player].resources[give] >= tradeRatio(state, player, give);
}

export function bankTrade(state: GameState, player: number, give: Resource, receive: Resource): void {
  const r = tradeRatio(state, player, give);
  state.players[player].resources[give] -= r;
  state.players[player].resources[receive] += 1;
}

// ---- Kervancı ----

/** Kervancı tile'a bitişik, kartı olan rakiplerin listesi. */
export function robberVictims(state: GameState, tileId: number, thief: number): number[] {
  const set = new Set<number>();
  for (const v of state.tiles[tileId].corners) {
    const b = state.buildings[v];
    if (b && b.owner !== thief && resourceCount(state.players[b.owner]) > 0) set.add(b.owner);
  }
  return [...set];
}

/** Bir rakipten rastgele bir kaynak çalar. Çalınan kaynağı döner (yoksa null). */
export function stealRandom(state: GameState, from: number, to: number): Resource | null {
  const pool: Resource[] = [];
  for (const r of RESOURCES) for (let i = 0; i < state.players[from].resources[r]; i++) pool.push(r);
  if (pool.length === 0) return null;
  const res = pool[Math.floor(Math.random() * pool.length)];
  state.players[from].resources[res] -= 1;
  state.players[to].resources[res] += 1;
  return res;
}

/** 7 atıldığında 7'den fazla kartı olan oyuncular yarısını (rastgele) atar. Çocuk Modu'nda çalışmaz. */
export function discardOnSeven(state: GameState): string[] {
  const msgs: string[] = [];
  if (state.kidMode) return msgs;
  for (const p of state.players) {
    const n = resourceCount(p);
    if (n <= 7) continue;
    let toDiscard = Math.floor(n / 2);
    const pool: Resource[] = [];
    for (const r of RESOURCES) for (let i = 0; i < p.resources[r]; i++) pool.push(r);
    while (toDiscard-- > 0 && pool.length) {
      const idx = Math.floor(Math.random() * pool.length);
      const res = pool.splice(idx, 1)[0];
      p.resources[res] -= 1;
    }
    msgs.push(`${p.name} kartlarının yarısını attı.`);
  }
  return msgs;
}

// ---- En uzun yol ----

function longestRoadFor(state: GameState, player: number): number {
  const myEdges = state.edges.filter((e) => state.roads[e.id] === player).map((e) => e.id);
  if (myEdges.length === 0) return 0;
  const incident = new Map<number, number[]>();
  for (const eid of myEdges) {
    for (const v of [state.edges[eid].a, state.edges[eid].b]) {
      const arr = incident.get(v) ?? [];
      arr.push(eid);
      incident.set(v, arr);
    }
  }
  const blocked = (v: number) => {
    const b = state.buildings[v];
    return !!b && b.owner !== player; // rakip binası yolu böler
  };

  let best = 0;
  const walk = (atVertex: number, used: Set<number>) => {
    if (used.size > best) best = used.size;
    if (blocked(atVertex)) return;
    for (const ne of incident.get(atVertex) ?? []) {
      if (used.has(ne)) continue;
      const e = state.edges[ne];
      const far = e.a === atVertex ? e.b : e.a;
      used.add(ne);
      walk(far, used);
      used.delete(ne);
    }
  };

  for (const first of myEdges) {
    const e = state.edges[first];
    for (const ep of [e.a, e.b]) {
      walk(ep, new Set([first]));
    }
  }
  return best;
}

/** En uzun yol sahipliğini günceller (holder kuralı: sadece kesin geçilerek alınır). */
export function updateLongestRoad(state: GameState): void {
  const lengths = state.players.map((_, i) => longestRoadFor(state, i));
  const max = Math.max(...lengths);
  if (max < EN_UZUN_YOL_ESIK) {
    state.longestRoad = { owner: null, length: 0 };
    return;
  }
  const leaders = lengths.map((l, i) => ({ l, i })).filter((x) => x.l === max).map((x) => x.i);
  const current = state.longestRoad.owner;
  if (current !== null && leaders.includes(current)) {
    state.longestRoad = { owner: current, length: max };
  } else if (leaders.length === 1) {
    state.longestRoad = { owner: leaders[0], length: max };
  } else {
    // Beraberlik ve önceki sahip lider değil → kimse kesin geçmedi, mevcut durumu koru.
    state.longestRoad = {
      owner: current,
      length: current !== null ? lengths[current] : 0,
    };
  }
}

// ---- Kazanma ----

export function checkWinner(state: GameState): number | null {
  for (let i = 0; i < state.players.length; i++) {
    if (score(state, i) >= state.targetScore) return i;
  }
  return null;
}
