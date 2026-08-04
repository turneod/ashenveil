// Tur akışı ve etkileşim. Oturum (yerel/host/guest) soyutlaması üzerinden çalışır:
// yalnızca sırası gelen istemci oynar; herkes aynı durumu görür.
// Tahta, yakınlaştırma/kaydırma kabında tutulur; zoom durumu yeniden çizimlerde korunur.

import type { GameState } from '../game/types';
import {
  canPlaceSetupSettlement, canPlaceRoad, canPlaceSettlement, canUpgradeCity, buildingsOf,
} from '../game/rules';
import type { NetAction } from '../game/apply';
import type { Session } from '../session';
import { renderBoard } from '../render/boardView';
import type { BoardHandlers } from '../render/boardView';
import { renderHUD } from '../render/hud';
import type { BuildMode, HudActions } from '../render/hud';
import { BoardViewport } from './boardViewport';

interface Shell {
  game: HTMLElement;
  viewport: BoardViewport;
  hud: HTMLElement;
}

export class GameController {
  private buildMode: BuildMode = null;
  private shell: Shell | null = null;

  constructor(
    private root: HTMLElement,
    private session: Session,
    private onNewGame: () => void,
  ) {
    session.onUpdate(() => this.render());
    this.render();
  }

  private send(a: NetAction): void {
    this.buildMode = null;
    this.session.dispatch(a);
    this.render();
  }

  private render(): void {
    const state = this.session.getState();
    if (!state) {
      const c = document.createElement('div');
      c.className = 'connecting';
      c.textContent = 'Bağlanılıyor…';
      this.root.replaceChildren(c);
      this.shell = null;
      return;
    }

    const seat = this.session.mySeat;
    const viewerSeat = seat === 'local' ? state.current : seat;
    const myTurn = state.phase !== 'bitti' && (seat === 'local' || seat === state.current);

    const board = renderBoard(state, this.boardHandlers(state, myTurn));
    const hud = renderHUD(state, this.hudActions(), { viewerSeat, myTurn });

    if (!this.shell) {
      const game = document.createElement('div');
      game.className = 'game';
      const viewport = new BoardViewport();
      game.append(viewport.el, hud);
      this.root.replaceChildren(game);
      this.shell = { game, viewport, hud };
      viewport.setContent(board); // el DOM'a girdikten sonra sığdır
    } else {
      this.shell.viewport.setContent(board);
      this.shell.game.replaceChild(hud, this.shell.hud);
      this.shell.hud = hud;
    }
  }

  private hudActions(): HudActions {
    return {
      buildMode: this.buildMode,
      onRoll: () => this.send({ t: 'roll' }),
      onBuild: (m) => { this.buildMode = m; this.render(); },
      onBankTrade: (g, r) => this.send({ t: 'bankTrade', give: g, receive: r }),
      onEndTurn: () => this.send({ t: 'endTurn' }),
      onNewGame: () => this.onNewGame(),
    };
  }

  private boardHandlers(s: GameState, myTurn: boolean): BoardHandlers {
    if (!myTurn) return {};

    if (s.phase === 'kurulum') {
      if (s.setupSubStage === 'koy') {
        return {
          legalVertices: this.vertexSet(s, (v) => canPlaceSetupSettlement(s, v)),
          onVertex: (id) => this.send({ t: 'setupSettlement', vertex: id }),
        };
      }
      return {
        legalEdges: this.edgeSet(s, (e) => canPlaceRoad(s, e, s.current, s.setupLastVertex)),
        onEdge: (id) => this.send({ t: 'setupRoad', edge: id }),
      };
    }

    if (s.phase === 'kervanci') {
      return { legalTiles: true, onTile: (id) => this.send({ t: 'moveRobber', tile: id }) };
    }

    if (s.phase === 'aksiyon') {
      if (this.buildMode === 'yol') {
        return {
          legalEdges: this.edgeSet(s, (e) => canPlaceRoad(s, e, s.current)),
          onEdge: (id) => this.send({ t: 'buildRoad', edge: id }),
        };
      }
      if (this.buildMode === 'koy') {
        return {
          legalVertices: this.vertexSet(s, (v) => canPlaceSettlement(s, v, s.current)),
          onVertex: (id) => this.send({ t: 'buildSettlement', vertex: id }),
        };
      }
      if (this.buildMode === 'sehir') {
        return {
          legalVertices: new Set(buildingsOf(s, s.current).filter((v) => canUpgradeCity(s, v, s.current))),
          onVertex: (id) => this.send({ t: 'buildCity', vertex: id }),
        };
      }
    }

    return {};
  }

  private vertexSet(s: GameState, pred: (v: number) => boolean): Set<number> {
    const set = new Set<number>();
    for (const v of s.vertices) if (pred(v.id)) set.add(v.id);
    return set;
  }

  private edgeSet(s: GameState, pred: (e: number) => boolean): Set<number> {
    const set = new Set<number>();
    for (const e of s.edges) if (pred(e.id)) set.add(e.id);
    return set;
  }
}
