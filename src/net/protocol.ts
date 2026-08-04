// Host ve guest arasındaki mesaj protokolü.

import type { GameState } from '../game/types';
import type { NetAction } from '../game/apply';

export interface LobbyPlayer {
  seat: number;
  name: string;
}

export type NetMessage =
  | { t: 'hello'; name: string } // guest -> host (katılırken)
  | { t: 'welcome'; seat: number } // host -> guest (koltuk ataması)
  | { t: 'lobby'; players: LobbyPlayer[] } // host -> herkes (lobi listesi)
  | { t: 'state'; state: GameState } // host -> herkes (tam durum)
  | { t: 'action'; action: NetAction } // guest -> host (eylem isteği)
  | { t: 'full' }; // host -> guest (oda dolu / oyun başladı)

/** Oda kodlarını genel PeerJS aracısında ayrıştırmak için önek. */
export const ROOM_PREFIX = 'bereketvadisi-';
