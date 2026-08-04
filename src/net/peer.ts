// PeerJS taşıma katmanı: host bir oda kodu yayınlar, guest'ler bu koda bağlanır.
// İşaretleşme (signaling) için PeerJS'in ücretsiz genel aracısı kullanılır; sunucu gerekmez.

import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { NetMessage } from './protocol';
import { ROOM_PREFIX } from './protocol';

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışması kolay harfler yok
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function errType(err: unknown): string {
  if (err && typeof err === 'object' && 'type' in err) return String((err as { type: unknown }).type);
  return String(err);
}

export interface HostNet {
  broadcast(msg: NetMessage): void;
  close(): void;
}

export interface HostHandlers {
  onReady(roomCode: string): void;
  onError(msg: string): void;
  onData(conn: DataConnection, msg: NetMessage): void;
  onLeave(conn: DataConnection): void;
}

export function startHost(h: HostHandlers): HostNet {
  const conns: DataConnection[] = [];
  let peer: Peer;
  let tries = 0;

  const create = (code: string) => {
    peer = new Peer(ROOM_PREFIX + code);
    peer.on('open', () => h.onReady(code));
    peer.on('error', (err) => {
      const type = errType(err);
      if (type === 'unavailable-id' && tries < 5) {
        tries++;
        peer.destroy();
        create(randomCode());
      } else {
        h.onError(type);
      }
    });
    peer.on('connection', (conn) => {
      conns.push(conn);
      conn.on('data', (d) => h.onData(conn, d as NetMessage));
      const gone = () => {
        const i = conns.indexOf(conn);
        if (i >= 0) conns.splice(i, 1);
        h.onLeave(conn);
      };
      conn.on('close', gone);
      conn.on('error', gone);
    });
  };

  create(randomCode());

  return {
    broadcast: (msg) => {
      for (const c of conns) if (c.open) c.send(msg);
    },
    close: () => peer.destroy(),
  };
}

export interface GuestNet {
  send(msg: NetMessage): void;
  close(): void;
}

export interface GuestHandlers {
  onOpen(): void;
  onData(msg: NetMessage): void;
  onError(msg: string): void;
  onClose(): void;
}

export function joinHost(roomCode: string, h: GuestHandlers): GuestNet {
  const peer = new Peer();
  let conn: DataConnection | null = null;

  peer.on('open', () => {
    conn = peer.connect(ROOM_PREFIX + roomCode.toUpperCase(), { reliable: true });
    conn.on('open', () => h.onOpen());
    conn.on('data', (d) => h.onData(d as NetMessage));
    conn.on('close', () => h.onClose());
    conn.on('error', () => h.onError('baglanti-hatasi'));
  });
  peer.on('error', (err) => h.onError(errType(err)));

  return {
    send: (msg) => { if (conn && conn.open) conn.send(msg); },
    close: () => peer.destroy(),
  };
}
