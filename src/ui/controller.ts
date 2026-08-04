// Tur akışı ve etkileşim. Oturum (yerel/host/guest) soyutlaması üzerinden çalışır:
// yalnızca sırası gelen istemci oynar; herkes aynı durumu görür.
// Tahta yakınlaştırma/kaydırma kabında; zar sol üstte; zoom durumu korunur.

import type { GameState } from '../game/types';
import {
  canPlaceSetupSettlement, canPlaceRoad, canPlaceSettlement, canUpgradeCity, buildingsOf,
} from '../game/rules';
import type { NetAction } from '../game/apply';
import type { Session } from '../session';
import { renderBoard } from '../render/boardView';
import type { BoardHandlers } from '../render/boardView';
import { renderHUD } from '../render/hud';
import type { BuildMode, HudActions, HudView } from '../render/hud';
import { BoardViewport } from './boardViewport';
import { DiceBox } from './diceBox';

interface Shell {
  game: HTMLElement;
  viewport: BoardViewport;
  dice: DiceBox;
  hud: HTMLElement;
}

export class GameController {
  private buildMode: BuildMode = null;
  private shell: Shell | null = null;
  private lastDiceKey: string | null = null;

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
      this.lastDiceKey = null;
      return;
    }

    const seat = this.session.mySeat;
    const local = seat === 'local';
    const trade = state.trade;
    const amResponder = !!trade && (local || seat === trade.to);
    const amProposer = !!trade && !amResponder && typeof seat === 'number' && seat === trade.from;
    const myTurn = state.phase !== 'bitti' && !trade && (local || seat === state.current);
    const viewerSeat = local ? (trade ? trade.to : state.current) : seat;

    const view: HudView = { viewerSeat, myTurn, amResponder, amProposer };
    const board = renderBoard(state, myTurn ? this.boardHandlers(state) : {});
    const hud = renderHUD(state, this.hudActions(), view);

    if (!this.shell) {
      const game = document.createElement('div');
      game.className = 'game';
      const viewport = new BoardViewport();
      const dice = new DiceBox();
      viewport.el.appendChild(dice.el);
      game.append(viewport.el, hud);
      this.root.replaceChildren(game);
      this.shell = { game, viewport, dice, hud };
      viewport.setContent(board);
    } else {
      this.shell.viewport.setContent(board);
      this.shell.game.replaceChild(hud, this.shell.hud);
      this.shell.hud = hud;
    }

    // Zar: yeni bir atışta yuvarlanma animasyonu
    const key = state.dice ? state.dice.join('-') : null;
    const animate = state.dice != null && key !== this.lastDiceKey;
    this.lastDiceKey = key;
    this.shell.dice.update(state.dice, animate);
  }

  private hudActions(): HudActions {
    return {
      buildMode: this.buildMode,
      onRoll: () => this.send({ t: 'roll' }),
      onBuild: (m) => { this.buildMode = m; this.render(); },
      onBankTrade: (g, r) => this.send({ t: 'bankTrade', give: g, receive: r }),
      onProposeTrade: (to, give, want) => this.send({ t: 'proposeTrade', to, give, want }),
      onRespondTrade: (accept) => this.send({ t: 'respondTrade', accept }),
      onCancelTrade: () => this.send({ t: 'cancelTrade' }),
      onEndTurn: () => this.send({ t: 'endTurn' }),
      onNewGame: () => this.onNewGame(),
    };
  }

  private boardHandlers(s: GameState): BoardHandlers {
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
