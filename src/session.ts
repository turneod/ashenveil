// Oturum soyutlaması: controller, oyunu yerel mi yoksa çevrimiçi mi olduğunu bilmeden çalışır.

import type { GameState } from './game/types';
import type { NetAction } from './game/apply';
import { applyNetAction } from './game/apply';

/** Bu istemcinin koltuğu: 'local' = aynı cihazda sırayla (sıradaki kişi kimse o oynar). */
export type Seat = number | 'local';

export interface Session {
  mySeat: Seat;
  getState(): GameState;
  dispatch(a: NetAction): void;
  onUpdate(cb: () => void): void;
  leave(): void;
}

/** Aynı cihazda sırayla oynanan yerel oturum. */
export class LocalSession implements Session {
  mySeat: Seat = 'local';
  private cb: () => void = () => {};
  constructor(private state: GameState) {}
  getState(): GameState { return this.state; }
  dispatch(a: NetAction): void { if (applyNetAction(this.state, a)) this.cb(); }
  onUpdate(cb: () => void): void { this.cb = cb; }
  leave(): void {}
}
