// Kurulum (başlangıç) fazı: klasik "yılan sırası" ile köy + yol yerleştirme.

import type { GameState } from './types';
import { buildingsOf, canPlaceSetupSettlement, canPlaceRoad, placeSettlement, placeRoad } from './rules';

/** n oyuncu için yılan sırası: 0..n-1 sonra n-1..0 (her biri bir köy + bir yol). */
export function makeSetupOrder(n: number): number[] {
  const forward = Array.from({ length: n }, (_, i) => i);
  return [...forward, ...forward.slice().reverse()];
}

/** Kurulumda köy yerleştir. İkinci köyde bitişik arazilerden başlangıç kaynağı verilir. */
export function setupPlaceSettlement(state: GameState, vertexId: number): boolean {
  if (state.phase !== 'kurulum' || state.setupSubStage !== 'koy') return false;
  if (!canPlaceSetupSettlement(state, vertexId)) return false;
  const player = state.current;
  const isSecond = buildingsOf(state, player).length === 1;
  placeSettlement(state, vertexId, player);
  state.setupLastVertex = vertexId;
  if (isSecond) {
    for (const tId of state.vertices[vertexId].tiles) {
      const t = state.tiles[tId];
      if (t.terrain !== 'col') state.players[player].resources[t.terrain] += 1;
    }
    state.log.unshift(`${state.players[player].name} ikinci köyünü kurdu ve başlangıç kaynaklarını aldı.`);
  } else {
    state.log.unshift(`${state.players[player].name} ilk köyünü kurdu.`);
  }
  state.setupSubStage = 'yol';
  return true;
}

/** Kurulumda yol yerleştir; ardından sıradaki yerleştirmeye geç (bitince oyun başlar). */
export function setupPlaceRoad(state: GameState, edgeId: number): boolean {
  if (state.phase !== 'kurulum' || state.setupSubStage !== 'yol') return false;
  if (!canPlaceRoad(state, edgeId, state.current, state.setupLastVertex)) return false;
  placeRoad(state, edgeId, state.current);
  state.setupLastVertex = null;
  state.setupOrder.shift();
  if (state.setupOrder.length === 0) {
    state.phase = 'zar';
    state.current = 0;
    state.dice = null;
    state.log.unshift('Kurulum tamam! Oyun başlıyor. İlk oyuncu zar atsın.');
  } else {
    state.current = state.setupOrder[0];
    state.setupSubStage = 'koy';
  }
  return true;
}
