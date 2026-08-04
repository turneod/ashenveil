// Oyun durumunu oluşturur ve tur geçişlerini/aksiyonları yönetir.

import type { GameState, Player, Resource } from './types';
import { PLAYER_COLORS, COSTS } from './types';
import { buildBoard } from './board';
import { rollDice, diceTotal } from './dice';
import { makeSetupOrder } from './setup';
import {
  hasResources, pay,
  canPlaceRoad, placeRoad, canPlaceSettlement, placeSettlement, canUpgradeCity, upgradeCity,
  produce, canBankTrade, bankTrade,
  discardOnSeven, robberVictims, stealRandom,
  updateLongestRoad, checkWinner,
} from './rules';

const EMPTY_RES = (): Record<Resource, number> => ({ odun: 0, tugla: 0, yun: 0, bugday: 0, tas: 0 });

export interface GameOptions {
  targetScore: number;
  kidMode: boolean;
}

export function createGame(names: string[], opts: GameOptions): GameState {
  const { geo, robber } = buildBoard();
  const players: Player[] = names.map((name, i) => ({
    id: i,
    name,
    color: PLAYER_COLORS[i],
    resources: EMPTY_RES(),
  }));
  const setupOrder = makeSetupOrder(players.length);
  return {
    players,
    tiles: geo.tiles,
    vertices: geo.vertices,
    edges: geo.edges,
    buildings: {},
    roads: {},
    robber,
    current: setupOrder[0],
    phase: 'kurulum',
    dice: null,
    targetScore: opts.targetScore,
    kidMode: opts.kidMode,
    setupOrder,
    setupSubStage: 'koy',
    setupLastVertex: null,
    longestRoad: { owner: null, length: 0 },
    winner: null,
    trade: null,
    log: ['Kurulum: ilk oyuncu bir köy ve ona bitişik bir yol yerleştirsin.'],
  };
}

// ---- Tur geçişleri ----

/** Zar at; 7 ise kervancı fazına, değilse üretim yapıp aksiyon fazına geçer. */
export function rollTurn(state: GameState): [number, number] | null {
  if (state.phase !== 'zar') return null;
  const dice = rollDice();
  state.dice = dice;
  const total = diceTotal(dice);
  const p = state.players[state.current];
  state.log.unshift(`${p.name} zar attı: ${dice[0]} + ${dice[1]} = ${total}`);
  if (total === 7) {
    for (const m of discardOnSeven(state)) state.log.unshift(m);
    state.phase = 'kervanci';
    state.log.unshift('7 geldi! Kervancıyı yeni bir araziye taşı.');
  } else {
    produce(state, total);
    state.phase = 'aksiyon';
  }
  return dice;
}

/** Kervancıyı taşı (7 sonrası). Çocuk Modu'nda çalma yok. */
export function moveRobberTo(state: GameState, tileId: number): boolean {
  if (state.phase !== 'kervanci') return false;
  if (tileId === state.robber) return false; // farklı bir araziye taşınmalı
  state.robber = tileId;
  if (!state.kidMode) {
    const victims = robberVictims(state, tileId, state.current);
    if (victims.length > 0) {
      const from = victims[Math.floor(Math.random() * victims.length)];
      const res = stealRandom(state, from, state.current);
      if (res) {
        state.log.unshift(`${state.players[state.current].name}, ${state.players[from].name}'den bir kaynak çaldı.`);
      }
    }
  }
  state.phase = 'aksiyon';
  return true;
}

// ---- İnşaat aksiyonları (aksiyon fazında) ----

function afterBuild(state: GameState): void {
  updateLongestRoad(state);
  const w = checkWinner(state);
  if (w !== null) {
    state.winner = w;
    state.phase = 'bitti';
    state.log.unshift(`🎉 ${state.players[w].name} ${state.targetScore} puana ulaştı ve kazandı!`);
  }
}

export function buildRoad(state: GameState, edgeId: number): boolean {
  if (state.phase !== 'aksiyon') return false;
  const player = state.current;
  if (!canPlaceRoad(state, edgeId, player)) return false;
  if (!hasResources(state.players[player], COSTS.yol)) return false;
  pay(state.players[player], COSTS.yol);
  placeRoad(state, edgeId, player);
  state.log.unshift(`${state.players[player].name} yol yaptı.`);
  afterBuild(state);
  return true;
}

export function buildSettlement(state: GameState, vertexId: number): boolean {
  if (state.phase !== 'aksiyon') return false;
  const player = state.current;
  if (!canPlaceSettlement(state, vertexId, player)) return false;
  if (!hasResources(state.players[player], COSTS.koy)) return false;
  pay(state.players[player], COSTS.koy);
  placeSettlement(state, vertexId, player);
  state.log.unshift(`${state.players[player].name} köy kurdu.`);
  afterBuild(state);
  return true;
}

export function buildCity(state: GameState, vertexId: number): boolean {
  if (state.phase !== 'aksiyon') return false;
  const player = state.current;
  if (!canUpgradeCity(state, vertexId, player)) return false;
  if (!hasResources(state.players[player], COSTS.sehir)) return false;
  pay(state.players[player], COSTS.sehir);
  upgradeCity(state, vertexId);
  state.log.unshift(`${state.players[player].name} köyünü şehre yükseltti.`);
  afterBuild(state);
  return true;
}

export function tradeWithBank(state: GameState, give: Resource, receive: Resource): boolean {
  if (state.phase !== 'aksiyon') return false;
  const player = state.current;
  if (!canBankTrade(state, player, give, receive)) return false;
  bankTrade(state, player, give, receive);
  state.log.unshift(`${state.players[player].name} banka ile takas yaptı.`);
  return true;
}

// ---- Oyuncular arası takas ----

/** Sırası gelen oyuncu bir rakibe takas teklif eder. */
export function offerTrade(
  state: GameState,
  to: number,
  give: Partial<Record<Resource, number>>,
  want: Partial<Record<Resource, number>>,
): boolean {
  if (state.phase !== 'aksiyon' || state.trade) return false;
  const from = state.current;
  if (to === from || to < 0 || to >= state.players.length) return false;
  if (!hasResources(state.players[from], give)) return false;
  const gTot = sumRes(give);
  const wTot = sumRes(want);
  if (gTot === 0 && wTot === 0) return false;
  state.trade = { from, to, give, want };
  state.log.unshift(`${state.players[from].name}, ${state.players[to].name}'e takas öneriyor.`);
  return true;
}

/** Teklif edilen oyuncu kabul/ret verir. */
export function answerTrade(state: GameState, accept: boolean): boolean {
  const t = state.trade;
  if (!t) return false;
  if (!accept) {
    state.log.unshift(`${state.players[t.to].name} takası reddetti.`);
    state.trade = null;
    return true;
  }
  // kabul: her iki taraf da vereceğine sahip olmalı
  if (!hasResources(state.players[t.from], t.give) || !hasResources(state.players[t.to], t.want)) {
    return false;
  }
  moveRes(state.players[t.from], state.players[t.to], t.give);
  moveRes(state.players[t.to], state.players[t.from], t.want);
  state.log.unshift(`${state.players[t.to].name} takası kabul etti.`);
  state.trade = null;
  return true;
}

/** Teklif eden vazgeçer. */
export function cancelOffer(state: GameState): boolean {
  if (!state.trade) return false;
  state.trade = null;
  return true;
}

function sumRes(map: Partial<Record<Resource, number>>): number {
  return (Object.values(map) as number[]).reduce((s, n) => s + (n ?? 0), 0);
}

function moveRes(from: Player, to: Player, map: Partial<Record<Resource, number>>): void {
  for (const r of Object.keys(map) as Resource[]) {
    const n = map[r] ?? 0;
    from.resources[r] -= n;
    to.resources[r] += n;
  }
}

/** Turu bitir: en uzun yolu güncelle, kazananı kontrol et, sırayı devret. */
export function endTurn(state: GameState): boolean {
  if (state.phase !== 'aksiyon' || state.trade) return false;
  updateLongestRoad(state);
  const w = checkWinner(state);
  if (w !== null) {
    state.winner = w;
    state.phase = 'bitti';
    state.log.unshift(`🎉 ${state.players[w].name} kazandı!`);
    return true;
  }
  state.current = (state.current + 1) % state.players.length;
  state.phase = 'zar';
  state.dice = null;
  state.log.unshift(`Sıra ${state.players[state.current].name}'de. Zar at.`);
  return true;
}
