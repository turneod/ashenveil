// Tur akışı ve etkileşim: tahta + HUD'u birbirine bağlar, yasal hedefleri hesaplar,
// her durum değişiminde yeniden çizer.

import type { GameState, Resource } from '../game/types';
import {
  canPlaceSetupSettlement, canPlaceRoad, canPlaceSettlement, canUpgradeCity, buildingsOf,
} from '../game/rules';
import {
  rollTurn, moveRobberTo, buildRoad, buildSettlement, buildCity, tradeWithBank, endTurn,
} from '../game/state';
import { setupPlaceSettlement, setupPlaceRoad } from '../game/setup';
import { renderBoard } from '../render/boardView';
import type { BoardHandlers } from '../render/boardView';
import { renderHUD } from '../render/hud';
import type { BuildMode, HudActions } from '../render/hud';

export class GameController {
  private buildMode: BuildMode = null;

  constructor(
    private root: HTMLElement,
    private state: GameState,
    private onNewGame: () => void,
  ) {
    this.render();
  }

  private render(): void {
    const handlers = this.boardHandlers();
    const board = renderBoard(this.state, handlers);
    const hud = renderHUD(this.state, this.hudActions());

    this.root.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'game';
    const boardWrap = document.createElement('div');
    boardWrap.className = 'board-wrap';
    boardWrap.append(board);
    wrap.append(boardWrap, hud);
    this.root.append(wrap);
  }

  private boardHandlers(): BoardHandlers {
    const s = this.state;
    if (s.phase === 'kurulum') {
      if (s.setupSubStage === 'koy') {
        return {
          legalVertices: this.vertexSet((v) => canPlaceSetupSettlement(s, v)),
          onVertex: (id) => this.act(() => setupPlaceSettlement(s, id)),
        };
      }
      return {
        legalEdges: this.edgeSet((e) => canPlaceRoad(s, e, s.current, s.setupLastVertex)),
        onEdge: (id) => this.act(() => setupPlaceRoad(s, id)),
      };
    }

    if (s.phase === 'kervanci') {
      return { legalTiles: true, onTile: (id) => this.act(() => moveRobberTo(s, id)) };
    }

    if (s.phase === 'aksiyon') {
      if (this.buildMode === 'yol') {
        return {
          legalEdges: this.edgeSet((e) => canPlaceRoad(s, e, s.current)),
          onEdge: (id) => this.act(() => { const ok = buildRoad(s, id); if (ok) this.buildMode = null; return ok; }),
        };
      }
      if (this.buildMode === 'koy') {
        return {
          legalVertices: this.vertexSet((v) => canPlaceSettlement(s, v, s.current)),
          onVertex: (id) => this.act(() => { const ok = buildSettlement(s, id); if (ok) this.buildMode = null; return ok; }),
        };
      }
      if (this.buildMode === 'sehir') {
        return {
          legalVertices: new Set(buildingsOf(s, s.current).filter((v) => canUpgradeCity(s, v, s.current))),
          onVertex: (id) => this.act(() => { const ok = buildCity(s, id); if (ok) this.buildMode = null; return ok; }),
        };
      }
    }

    return {};
  }

  private hudActions(): HudActions {
    const s = this.state;
    return {
      buildMode: this.buildMode,
      onRoll: () => this.act(() => rollTurn(s) !== null),
      onBuild: (m) => { this.buildMode = m; this.render(); },
      onBankTrade: (g: Resource, r: Resource) => this.act(() => tradeWithBank(s, g, r)),
      onEndTurn: () => this.act(() => { this.buildMode = null; return endTurn(s); }),
      onNewGame: () => this.onNewGame(),
    };
  }

  /** Bir mutasyonu çalıştır; başarılıysa yeniden çiz. */
  private act(fn: () => boolean): void {
    const ok = fn();
    if (ok) this.render();
  }

  private vertexSet(pred: (v: number) => boolean): Set<number> {
    const set = new Set<number>();
    for (const v of this.state.vertices) if (pred(v.id)) set.add(v.id);
    return set;
  }

  private edgeSet(pred: (e: number) => boolean): Set<number> {
    const set = new Set<number>();
    for (const e of this.state.edges) if (pred(e.id)) set.add(e.id);
    return set;
  }
}
