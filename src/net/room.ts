// Çevrimiçi oda: host yetkili durumu tutar, guest'ler eylem gönderir.
// HostRoom ve GuestRoom, controller'ın kullandığı Session arayüzünü uygular.

import type { GameState } from '../game/types';
import type { NetAction } from '../game/apply';
import { applyNetAction, canActorApply } from '../game/apply';
import { createGame } from '../game/state';
import type { Session, Seat } from '../session';
import type { HostNet, GuestNet } from './peer';
import { startHost, joinHost } from './peer';
import type { NetMessage, LobbyPlayer } from './protocol';
import type { DataConnection } from 'peerjs';

const MAX_PLAYERS = 4;

export interface HostRoomHandlers {
  onReady(roomCode: string): void;
  onError(msg: string): void;
  onLobby(players: LobbyPlayer[]): void;
  onStart(): void;
}

export interface GuestRoomHandlers {
  onError(msg: string): void;
  onLobby(players: LobbyPlayer[]): void;
  onStart(): void;
  onClose(): void;
}

export class HostRoom implements Session {
  mySeat: Seat = 0;
  private net: HostNet;
  private state: GameState | null = null;
  private started = false;
  private updateCb: () => void = () => {};
  private guests: { conn: DataConnection; name: string }[] = [];

  constructor(
    private opts: { hostName: string; targetScore: number; kidMode: boolean },
    private h: HostRoomHandlers,
  ) {
    this.net = startHost({
      onReady: (c) => this.h.onReady(c),
      onError: (m) => this.h.onError(m),
      onData: (conn, msg) => this.onData(conn, msg),
      onLeave: (conn) => this.onLeave(conn),
    });
  }

  private players(): LobbyPlayer[] {
    const list: LobbyPlayer[] = [{ seat: 0, name: this.opts.hostName }];
    this.guests.forEach((g, i) => list.push({ seat: i + 1, name: g.name }));
    return list;
  }

  private syncLobby(): void {
    const players = this.players();
    this.guests.forEach((g, i) => {
      if (g.conn.open) {
        g.conn.send({ t: 'welcome', seat: i + 1 });
        g.conn.send({ t: 'lobby', players });
      }
    });
    this.h.onLobby(players);
  }

  private onData(conn: DataConnection, msg: NetMessage): void {
    if (msg.t === 'hello') {
      if (this.started || this.guests.length >= MAX_PLAYERS - 1) {
        if (conn.open) conn.send({ t: 'full' });
        return;
      }
      const name = (msg.name || '').trim() || `Oyuncu ${this.guests.length + 2}`;
      this.guests.push({ conn, name });
      this.syncLobby();
    } else if (msg.t === 'action') {
      const gi = this.guests.findIndex((g) => g.conn === conn);
      if (gi >= 0) this.hostApply(gi + 1, msg.action);
    }
  }

  private onLeave(conn: DataConnection): void {
    const gi = this.guests.findIndex((g) => g.conn === conn);
    if (gi < 0) return;
    if (!this.started) {
      this.guests.splice(gi, 1);
      this.syncLobby();
    } else {
      this.h.onLobby(this.players()); // oyun sürerken koltuğu koru
    }
  }

  private hostApply(seat: number, action: NetAction): void {
    if (!this.state) return;
    if (!canActorApply(this.state, seat, action)) return; // sıra/teklif yetkisi
    if (applyNetAction(this.state, action)) {
      this.net.broadcast({ t: 'state', state: this.state });
      this.updateCb();
    }
  }

  playerCount(): number { return this.guests.length + 1; }
  canStart(): boolean { return this.playerCount() >= 2 && !this.started; }

  start(): void {
    if (!this.canStart()) return;
    const names = this.players().map((p) => p.name);
    this.state = createGame(names, { targetScore: this.opts.targetScore, kidMode: this.opts.kidMode });
    this.started = true;
    this.net.broadcast({ t: 'state', state: this.state });
    this.h.onStart();
    this.updateCb();
  }

  // ---- Session ----
  getState(): GameState { return this.state as GameState; }
  dispatch(a: NetAction): void { this.hostApply(0, a); }
  onUpdate(cb: () => void): void { this.updateCb = cb; }
  leave(): void { this.net.close(); }
}

export class GuestRoom implements Session {
  mySeat: Seat = 1;
  private net: GuestNet;
  private state: GameState | null = null;
  private started = false;
  private updateCb: () => void = () => {};

  constructor(code: string, private name: string, private h: GuestRoomHandlers) {
    this.net = joinHost(code, {
      onOpen: () => this.net.send({ t: 'hello', name: this.name }),
      onData: (msg) => this.onData(msg),
      onError: (m) => this.h.onError(m),
      onClose: () => this.h.onClose(),
    });
  }

  private onData(msg: NetMessage): void {
    switch (msg.t) {
      case 'welcome':
        this.mySeat = msg.seat;
        break;
      case 'lobby':
        this.h.onLobby(msg.players);
        break;
      case 'full':
        this.h.onError('oda-dolu');
        this.net.close();
        break;
      case 'state':
        this.state = msg.state;
        if (!this.started) { this.started = true; this.h.onStart(); }
        this.updateCb();
        break;
      default:
        break;
    }
  }

  // ---- Session ----
  getState(): GameState { return this.state as GameState; }
  dispatch(a: NetAction): void { this.net.send({ t: 'action', action: a }); }
  onUpdate(cb: () => void): void { this.updateCb = cb; }
  leave(): void { this.net.close(); }
}
