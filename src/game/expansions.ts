// Paketlere özel mantık: Görev (gizli hedef) kartları, Olay kartları ve
// gelişim kartları/En Büyük Ordu/görevleri kapsayan tam puan hesabı.

import type { GameState, ObjectiveId, Resource } from './types';
import {
  RESOURCES, ZAFER_KART_PUAN, EN_BUYUK_ORDU_PUAN, EN_BUYUK_ORDU_ESIK, GOREV_PUAN,
} from './types';
import { score as baseScore, buildingsOf } from './rules';

export const OBJECTIVES: ObjectiveId[] = ['yollar', 'cesitlilik', 'sehirler', 'liman', 'buyukKoy'];

export const OBJECTIVE_TEXT: Record<ObjectiveId, string> = {
  yollar: 'En az 6 yol inşa et',
  cesitlilik: '3 farklı arazi türünde bina kur',
  sehirler: 'En az 2 şehir kur',
  liman: 'Bir limana köy/şehir kur',
  buyukKoy: 'Aynı anda 4 binaya sahip ol',
};

function roadsOf(state: GameState, player: number): number {
  return Object.values(state.roads).filter((o) => o === player).length;
}

function citiesOf(state: GameState, player: number): number {
  return buildingsOf(state, player).filter((v) => state.buildings[v].type === 'sehir').length;
}

function distinctTerrains(state: GameState, player: number): number {
  const set = new Set<string>();
  for (const v of buildingsOf(state, player)) {
    for (const t of state.vertices[v].tiles) {
      const terr = state.tiles[t].terrain;
      if (terr !== 'col') set.add(terr);
    }
  }
  return set.size;
}

function hasPortBuilding(state: GameState, player: number): boolean {
  return buildingsOf(state, player).some((v) => state.vertices[v].port !== null);
}

export function evalObjective(state: GameState, player: number): boolean {
  switch (state.players[player].objective) {
    case 'yollar': return roadsOf(state, player) >= 6;
    case 'cesitlilik': return distinctTerrains(state, player) >= 3;
    case 'sehirler': return citiesOf(state, player) >= 2;
    case 'liman': return hasPortBuilding(state, player);
    case 'buyukKoy': return buildingsOf(state, player).length >= 4;
    default: return false;
  }
}

/** Görevleri değerlendir (yapışkan: bir kez tamamlanınca kalır). */
export function refreshObjectives(state: GameState): void {
  if (!state.packs.gorev) return;
  state.players.forEach((p, i) => {
    if (!p.objectiveDone && evalObjective(state, i)) p.objectiveDone = true;
  });
}

/** En Büyük Ordu sahipliğini günceller (3+ şövalye, holder kuralı). */
export function updateLargestArmy(state: GameState): void {
  const sizes = state.players.map((p) => p.knights);
  const max = Math.max(...sizes);
  if (max < EN_BUYUK_ORDU_ESIK) { state.largestArmy = { owner: null, size: 0 }; return; }
  const leaders = sizes.map((s, i) => ({ s, i })).filter((x) => x.s === max).map((x) => x.i);
  const cur = state.largestArmy.owner;
  if (cur !== null && leaders.includes(cur)) state.largestArmy = { owner: cur, size: max };
  else if (leaders.length === 1) state.largestArmy = { owner: leaders[0], size: max };
  else state.largestArmy = { owner: cur, size: cur !== null ? sizes[cur] : 0 };
}

/** Tam puan: binalar + en uzun yol + zafer kartları + En Büyük Ordu + görev. */
export function fullScore(state: GameState, player: number): number {
  let s = baseScore(state, player);
  s += state.players[player].dev.zafer * ZAFER_KART_PUAN;
  if (state.largestArmy.owner === player) s += EN_BUYUK_ORDU_PUAN;
  if (state.packs.gorev && state.players[player].objectiveDone) s += GOREV_PUAN;
  return s;
}

export function checkWinnerFull(state: GameState): number | null {
  for (let i = 0; i < state.players.length; i++) {
    if (fullScore(state, i) >= state.targetScore) return i;
  }
  return null;
}

// ---- Olay kartları ----

function randRes(): Resource {
  return RESOURCES[Math.floor(Math.random() * RESOURCES.length)];
}

/** %25 ihtimalle bir olay uygular; açıklamasını döner (yoksa null). Üretimden sonra çağrılır. */
export function maybeEvent(state: GameState): string | null {
  if (!state.packs.olay) return null;
  if (Math.random() > 0.25) return null;
  const roll = Math.floor(Math.random() * 3);
  if (roll === 0) {
    const r = randRes();
    for (const p of state.players) p.resources[r] += 1;
    return `Şenlik! Herkes 1 kaynak aldı.`;
  }
  if (roll === 1) {
    const cur = state.players[state.current];
    cur.resources[randRes()] += 2;
    return `Bolluk! ${cur.name} 2 kaynak buldu.`;
  }
  const cur = state.players[state.current];
  const pool: Resource[] = [];
  for (const r of RESOURCES) for (let i = 0; i < cur.resources[r]; i++) pool.push(r);
  if (pool.length > 0) {
    cur.resources[pool[Math.floor(Math.random() * pool.length)]] -= 1;
    return `Fırtına! ${cur.name} 1 kaynak kaybetti.`;
  }
  return null;
}
