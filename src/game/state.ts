// Oyun durumunu oluşturur ve tur geçişlerini/aksiyonları yönetir.

import type { GameState, Player, Resource, DevCardType, PackConfig } from './types';
import { PLAYER_COLORS, COSTS, DEV_COST, DEV_DECK } from './types';
import { buildBoard, shuffle } from './board';
import { rollDice, diceTotal } from './dice';
import { makeSetupOrder } from './setup';
import {
  hasResources, pay,
  canPlaceRoad, placeRoad, canPlaceSettlement, placeSettlement, canUpgradeCity, upgradeCity,
  produce, canBankTrade, bankTrade,
  discardOnSeven, robberVictims, stealRandom,
  updateLongestRoad,
} from './rules';
import {
  OBJECTIVES, refreshObjectives, updateLargestArmy, checkWinnerFull, maybeEvent,
} from './expansions';

const EMPTY_RES = (): Record<Resource, number> => ({ odun: 0, tugla: 0, yun: 0, bugday: 0, tas: 0 });
const EMPTY_DEV = (): Record<DevCardType, number> => ({ sovalye: 0, yolYapimi: 0, bereketYili: 0, tekel: 0, zafer: 0 });

export interface GameOptions {
  targetScore: number;
  kidMode: boolean;
  packs: PackConfig;
}

export function createGame(names: string[], opts: GameOptions): GameState {
  const { geo, robber } = buildBoard();
  const objectives = shuffle(OBJECTIVES);
  const players: Player[] = names.map((name, i) => ({
    id: i,
    name,
    color: PLAYER_COLORS[i],
    resources: EMPTY_RES(),
    dev: EMPTY_DEV(),
    devNew: [],
    knights: 0,
    playedDevThisTurn: false,
    objective: opts.packs.gorev ? objectives[i % objectives.length] : null,
    objectiveDone: false,
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
    largestArmy: { owner: null, size: 0 },
    winner: null,
    trade: null,
    devDeck: shuffle(DEV_DECK),
    freeRoads: 0,
    packs: opts.packs,
    lastEvent: null,
    log: ['Kurulum: ilk oyuncu bir köy ve ona bitişik bir yol yerleştirsin.'],
  };
}

// ---- Tur geçişleri ----

/** Zar at; 7 ise kervancı fazına, değilse üretim yapıp aksiyon fazına geçer. */
export function rollTurn(state: GameState): [number, number] | null {
  if (state.phase !== 'zar') return null;
  const dice = rollDice();
  state.dice = dice;
  state.lastEvent = null;
  const total = diceTotal(dice);
  const p = state.players[state.current];
  state.log.unshift(`${p.name} zar attı: ${dice[0]} + ${dice[1]} = ${total}`);
  if (total === 7) {
    for (const m of discardOnSeven(state)) state.log.unshift(m);
    state.phase = 'kervanci';
    state.log.unshift('7 geldi! Kervancıyı yeni bir araziye taşı.');
  } else {
    produce(state, total);
    const ev = maybeEvent(state);
    if (ev) { state.lastEvent = ev; state.log.unshift('Olay: ' + ev); }
    state.phase = 'aksiyon';
  }
  return dice;
}

/** Kervancıyı taşı (7 ya da Şövalye sonrası). Çocuk Modu'nda çalma yok. */
export function moveRobberTo(state: GameState, tileId: number): boolean {
  if (state.phase !== 'kervanci') return false;
  if (tileId === state.robber) return false;
  state.robber = tileId;
  if (!state.kidMode) {
    const victims = robberVictims(state, tileId, state.current);
    if (victims.length > 0) {
      const from = victims[Math.floor(Math.random() * victims.length)];
      const res = stealRandom(state, from, state.current);
      if (res) state.log.unshift(`${state.players[state.current].name}, ${state.players[from].name}'den bir kaynak çaldı.`);
    }
  }
  state.phase = 'aksiyon';
  return true;
}

// ---- İnşaat aksiyonları ----

function afterBuild(state: GameState): void {
  updateLongestRoad(state);
  refreshObjectives(state);
  const w = checkWinnerFull(state);
  if (w !== null) {
    state.winner = w;
    state.phase = 'bitti';
    state.log.unshift(`${state.players[w].name} ${state.targetScore} puana ulaştı ve kazandı!`);
  }
}

export function buildRoad(state: GameState, edgeId: number): boolean {
  if (state.phase !== 'aksiyon') return false;
  const player = state.current;
  if (!canPlaceRoad(state, edgeId, player)) return false;
  const free = state.freeRoads > 0;
  if (!free && !hasResources(state.players[player], COSTS.yol)) return false;
  if (free) state.freeRoads -= 1;
  else pay(state.players[player], COSTS.yol);
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

// ---- Gelişim kartları ----

function playableCount(p: Player, t: DevCardType): number {
  return p.dev[t] - p.devNew.filter((x) => x === t).length;
}

export function canBuyDev(state: GameState): boolean {
  return state.phase === 'aksiyon' && state.devDeck.length > 0 && hasResources(state.players[state.current], DEV_COST);
}

export function buyDev(state: GameState): boolean {
  if (!canBuyDev(state)) return false;
  const p = state.players[state.current];
  pay(p, DEV_COST);
  const card = state.devDeck.pop()!;
  p.dev[card] += 1;
  p.devNew.push(card);
  state.log.unshift(`${p.name} bir gelişim kartı aldı.`);
  afterBuild(state); // zafer puanı kazandırabilir
  return true;
}

function canPlay(state: GameState, t: DevCardType): boolean {
  if (state.phase !== 'aksiyon' || state.trade) return false;
  const p = state.players[state.current];
  return !p.playedDevThisTurn && playableCount(p, t) > 0;
}

export function playKnight(state: GameState): boolean {
  if (!canPlay(state, 'sovalye')) return false;
  const p = state.players[state.current];
  p.dev.sovalye -= 1;
  p.knights += 1;
  p.playedDevThisTurn = true;
  updateLargestArmy(state);
  state.log.unshift(`${p.name} Şövalye oynadı. Kervancıyı taşı.`);
  const w = checkWinnerFull(state);
  if (w !== null) { state.winner = w; state.phase = 'bitti'; state.log.unshift(`${state.players[w].name} kazandı!`); return true; }
  state.phase = 'kervanci';
  return true;
}

export function playRoadBuilding(state: GameState): boolean {
  if (!canPlay(state, 'yolYapimi')) return false;
  const p = state.players[state.current];
  p.dev.yolYapimi -= 1;
  p.playedDevThisTurn = true;
  state.freeRoads = 2;
  state.log.unshift(`${p.name} Yol Yapımı oynadı: 2 bedava yol yerleştir.`);
  return true;
}

export function playYearOfPlenty(state: GameState, r1: Resource, r2: Resource): boolean {
  if (!canPlay(state, 'bereketYili')) return false;
  const p = state.players[state.current];
  p.dev.bereketYili -= 1;
  p.playedDevThisTurn = true;
  p.resources[r1] += 1;
  p.resources[r2] += 1;
  state.log.unshift(`${p.name} Bereket Yılı oynadı: 2 kaynak aldı.`);
  return true;
}

export function playMonopoly(state: GameState, r: Resource): boolean {
  if (!canPlay(state, 'tekel')) return false;
  const p = state.players[state.current];
  p.dev.tekel -= 1;
  p.playedDevThisTurn = true;
  let taken = 0;
  state.players.forEach((o, i) => {
    if (i === state.current) return;
    taken += o.resources[r];
    o.resources[r] = 0;
  });
  p.resources[r] += taken;
  state.log.unshift(`${p.name} Tekel oynadı: rakiplerden ${taken} kaynak topladı.`);
  return true;
}

// ---- Oyuncular arası takas ----

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
  if (sumRes(give) === 0 && sumRes(want) === 0) return false;
  state.trade = { from, to, give, want };
  state.log.unshift(`${state.players[from].name}, ${state.players[to].name}'e takas öneriyor.`);
  return true;
}

export function answerTrade(state: GameState, accept: boolean): boolean {
  const t = state.trade;
  if (!t) return false;
  if (!accept) {
    state.log.unshift(`${state.players[t.to].name} takası reddetti.`);
    state.trade = null;
    return true;
  }
  if (!hasResources(state.players[t.from], t.give) || !hasResources(state.players[t.to], t.want)) return false;
  moveRes(state.players[t.from], state.players[t.to], t.give);
  moveRes(state.players[t.to], state.players[t.from], t.want);
  state.log.unshift(`${state.players[t.to].name} takası kabul etti.`);
  state.trade = null;
  return true;
}

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

/** Turu bitir: bonusları güncelle, kazananı kontrol et, sırayı devret. */
export function endTurn(state: GameState): boolean {
  if (state.phase !== 'aksiyon' || state.trade) return false;
  updateLongestRoad(state);
  updateLargestArmy(state);
  refreshObjectives(state);
  const w = checkWinnerFull(state);
  if (w !== null) {
    state.winner = w;
    state.phase = 'bitti';
    state.log.unshift(`${state.players[w].name} kazandı!`);
    return true;
  }
  // bu turdaki gelişim kartı sınırlarını sıfırla, yeni kartları oynanabilir yap
  const p = state.players[state.current];
  p.devNew = [];
  p.playedDevThisTurn = false;
  state.freeRoads = 0;
  state.current = (state.current + 1) % state.players.length;
  state.phase = 'zar';
  state.dice = null;
  state.log.unshift(`Sıra ${state.players[state.current].name}'de. Zar at.`);
  return true;
}
