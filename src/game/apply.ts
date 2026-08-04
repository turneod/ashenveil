// Ağ üzerinden taşınabilir oyun eylemleri ve bunları GameState'e uygulayan tek nokta.
// Hem yerel oyun hem de çevrimiçi (host) tarafı aynı fonksiyonu kullanır.

import type { GameState, Resource } from './types';
import {
  rollTurn, moveRobberTo, buildRoad, buildSettlement, buildCity, tradeWithBank, endTurn,
  offerTrade, answerTrade, cancelOffer,
  buyDev, playKnight, playRoadBuilding, playYearOfPlenty, playMonopoly,
} from './state';
import { setupPlaceSettlement, setupPlaceRoad } from './setup';

export type ResMap = Partial<Record<Resource, number>>;

export type NetAction =
  | { t: 'roll' }
  | { t: 'moveRobber'; tile: number }
  | { t: 'buildRoad'; edge: number }
  | { t: 'buildSettlement'; vertex: number }
  | { t: 'buildCity'; vertex: number }
  | { t: 'bankTrade'; give: Resource; receive: Resource }
  | { t: 'proposeTrade'; to: number; give: ResMap; want: ResMap }
  | { t: 'respondTrade'; accept: boolean }
  | { t: 'cancelTrade' }
  | { t: 'buyDev' }
  | { t: 'playKnight' }
  | { t: 'playRoadBuilding' }
  | { t: 'playPlenty'; r1: Resource; r2: Resource }
  | { t: 'playMonopoly'; r: Resource }
  | { t: 'endTurn' }
  | { t: 'setupSettlement'; vertex: number }
  | { t: 'setupRoad'; edge: number };

/** Eylemi uygular; durum gerçekten değiştiyse true döner. */
export function applyNetAction(state: GameState, a: NetAction): boolean {
  switch (a.t) {
    case 'roll': return rollTurn(state) !== null;
    case 'moveRobber': return moveRobberTo(state, a.tile);
    case 'buildRoad': return buildRoad(state, a.edge);
    case 'buildSettlement': return buildSettlement(state, a.vertex);
    case 'buildCity': return buildCity(state, a.vertex);
    case 'bankTrade': return tradeWithBank(state, a.give, a.receive);
    case 'proposeTrade': return offerTrade(state, a.to, a.give, a.want);
    case 'respondTrade': return answerTrade(state, a.accept);
    case 'cancelTrade': return cancelOffer(state);
    case 'buyDev': return buyDev(state);
    case 'playKnight': return playKnight(state);
    case 'playRoadBuilding': return playRoadBuilding(state);
    case 'playPlenty': return playYearOfPlenty(state, a.r1, a.r2);
    case 'playMonopoly': return playMonopoly(state, a.r);
    case 'endTurn': return endTurn(state);
    case 'setupSettlement': return setupPlaceSettlement(state, a.vertex);
    case 'setupRoad': return setupPlaceRoad(state, a.edge);
  }
}

/**
 * Çevrimiçi modda: bu koltuk (seat) bu eylemi yapabilir mi?
 * Genelde yalnızca sırası gelen; ancak bir takas teklifine yalnızca teklif edilen yanıt verir.
 */
export function canActorApply(state: GameState, seat: number, a: NetAction): boolean {
  if (a.t === 'respondTrade') return !!state.trade && seat === state.trade.to;
  return seat === state.current;
}
