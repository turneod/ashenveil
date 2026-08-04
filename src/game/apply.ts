// Ağ üzerinden taşınabilir oyun eylemleri ve bunları GameState'e uygulayan tek nokta.
// Hem yerel oyun hem de çevrimiçi (host) tarafı aynı fonksiyonu kullanır.

import type { GameState, Resource } from './types';
import {
  rollTurn, moveRobberTo, buildRoad, buildSettlement, buildCity, tradeWithBank, endTurn,
} from './state';
import { setupPlaceSettlement, setupPlaceRoad } from './setup';

export type NetAction =
  | { t: 'roll' }
  | { t: 'moveRobber'; tile: number }
  | { t: 'buildRoad'; edge: number }
  | { t: 'buildSettlement'; vertex: number }
  | { t: 'buildCity'; vertex: number }
  | { t: 'bankTrade'; give: Resource; receive: Resource }
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
    case 'endTurn': return endTurn(state);
    case 'setupSettlement': return setupPlaceSettlement(state, a.vertex);
    case 'setupRoad': return setupPlaceRoad(state, a.edge);
  }
}
