import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildGeometry } from '../src/game/geometry';
import { buildBoard } from '../src/game/board';
import { createGame, offerTrade, answerTrade } from '../src/game/state';
import {
  placeSettlement, canPlaceSetupSettlement, produce, tradeRatio, canBankTrade, bankTrade,
  updateLongestRoad, score, checkWinner,
} from '../src/game/rules';
import type { GameState } from '../src/game/types';

test('geometri: 19 karo, 54 köşe, 72 kenar', () => {
  const g = buildGeometry();
  assert.equal(g.tiles.length, 19);
  assert.equal(g.vertices.length, 54);
  assert.equal(g.edges.length, 72);
});

test('tahta: doğru arazi dağılımı ve kervancı çölde başlar', () => {
  const { geo, robber } = buildBoard();
  const counts: Record<string, number> = {};
  for (const t of geo.tiles) counts[t.terrain] = (counts[t.terrain] ?? 0) + 1;
  assert.equal(counts.odun, 4);
  assert.equal(counts.yun, 4);
  assert.equal(counts.bugday, 4);
  assert.equal(counts.tugla, 3);
  assert.equal(counts.tas, 3);
  assert.equal(counts.col, 1);
  assert.equal(geo.tiles[robber].terrain, 'col');
  // çöl-olmayan her karoda jeton var, çölde yok
  for (const t of geo.tiles) {
    if (t.terrain === 'col') assert.equal(t.token, null);
    else assert.notEqual(t.token, null);
  }
});

test('mesafe kuralı: köyün komşusuna köy kurulamaz', () => {
  const s = createGame(['A', 'B'], { targetScore: 10, kidMode: false });
  const v = 0;
  placeSettlement(s, v, 0);
  for (const n of s.vertices[v].neighbors) {
    assert.equal(canPlaceSetupSettlement(s, n), false);
  }
});

test('üretim: köy komşusundaki arazi zar gelince kaynak üretir', () => {
  const s = createGame(['A', 'B'], { targetScore: 10, kidMode: false });
  const tile = s.tiles.find((t) => t.terrain !== 'col' && t.id !== s.robber)!;
  placeSettlement(s, tile.corners[0], 0);
  produce(s, tile.token!);
  assert.ok(s.players[0].resources[tile.terrain as 'odun'] >= 1);
});

test('banka takası: varsayılan oran 4:1 ve takas gerçekleşir', () => {
  const s = createGame(['A', 'B'], { targetScore: 10, kidMode: false });
  s.players[0].resources.odun = 4;
  assert.equal(tradeRatio(s, 0, 'odun'), 4);
  assert.equal(canBankTrade(s, 0, 'odun', 'tas'), true);
  bankTrade(s, 0, 'odun', 'tas');
  assert.equal(s.players[0].resources.odun, 0);
  assert.equal(s.players[0].resources.tas, 1);
});

test('oyuncular arası takas: kabul edilince kaynaklar el değiştirir', () => {
  const s = createGame(['A', 'B'], { targetScore: 10, kidMode: false });
  s.phase = 'aksiyon';
  s.current = 0;
  s.players[0].resources.odun = 2;
  s.players[1].resources.tas = 1;
  assert.equal(offerTrade(s, 1, { odun: 2 }, { tas: 1 }), true);
  assert.ok(s.trade);
  assert.equal(answerTrade(s, true), true);
  assert.equal(s.players[0].resources.odun, 0);
  assert.equal(s.players[0].resources.tas, 1);
  assert.equal(s.players[1].resources.odun, 2);
  assert.equal(s.players[1].resources.tas, 0);
  assert.equal(s.trade, null);
});

test('oyuncular arası takas: reddedilince kaynaklar değişmez', () => {
  const s = createGame(['A', 'B'], { targetScore: 10, kidMode: false });
  s.phase = 'aksiyon';
  s.current = 0;
  s.players[0].resources.odun = 2;
  offerTrade(s, 1, { odun: 1 }, { tas: 1 });
  assert.equal(answerTrade(s, false), true);
  assert.equal(s.players[0].resources.odun, 2);
  assert.equal(s.trade, null);
});

test('en uzun yol: 5 yollu zincir sahipliği verir', () => {
  const s = createGame(['A', 'B'], { targetScore: 10, kidMode: false });
  const path = buildPath(s, 5);
  assert.equal(path.length, 5);
  for (const e of path) s.roads[e] = 0;
  updateLongestRoad(s);
  assert.equal(s.longestRoad.owner, 0);
  assert.ok(s.longestRoad.length >= 5);
});

test('puan ve kazanan: şehir 2 puan, hedefe ulaşan kazanır', () => {
  const s = createGame(['A', 'B'], { targetScore: 2, kidMode: false });
  placeSettlement(s, 0, 0);
  s.buildings[0].type = 'sehir';
  assert.equal(score(s, 0), 2);
  assert.equal(checkWinner(s), 0);
});

function edgeBetween(s: GameState, v: number, n: number): number {
  for (const eid of s.vertices[v].edges) {
    const e = s.edges[eid];
    if (e.a === n || e.b === n) return eid;
  }
  return -1;
}

function buildPath(s: GameState, len: number): number[] {
  let cur = 0;
  const usedV = new Set([0]);
  const path: number[] = [];
  while (path.length < len) {
    let moved = false;
    for (const n of s.vertices[cur].neighbors) {
      if (usedV.has(n)) continue;
      path.push(edgeBetween(s, cur, n));
      usedV.add(n);
      cur = n;
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return path;
}
