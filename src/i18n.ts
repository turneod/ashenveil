// Tüm Türkçe metinler ve görsel etiketler tek yerde.

import type { Resource, TerrainType, PortType } from './game/types';

export const RES_AD: Record<Resource, string> = {
  odun: 'Odun',
  tugla: 'Tuğla',
  yun: 'Yün',
  bugday: 'Buğday',
  tas: 'Taş',
};

export const RES_EMOJI: Record<Resource, string> = {
  odun: '🌲',
  tugla: '🧱',
  yun: '🐑',
  bugday: '🌾',
  tas: '⛰️',
};

export const TERRAIN_AD: Record<TerrainType, string> = {
  odun: 'Orman',
  tugla: 'Ocak',
  yun: 'Otlak',
  bugday: 'Tarla',
  tas: 'Dağ',
  col: 'Çöl',
};

export const TERRAIN_RENK: Record<TerrainType, string> = {
  odun: '#2f7d32', // orman yeşili
  tugla: '#c1592f', // kiremit
  yun: '#8fce6b', // otlak
  bugday: '#e8c04b', // buğday sarısı
  tas: '#9aa3ab', // dağ grisi
  col: '#e4d5a8', // çöl kumu
};

export function portEtiket(p: PortType): string {
  if (p === 'genel') return '3:1';
  return `2:1 ${RES_EMOJI[p]}`;
}

export const UI = {
  baslik: 'Bereket Vadisi',
  zarAt: '🎲 Zar At',
  turuBitir: 'Turu Bitir ▶',
  yol: 'Yol',
  koy: 'Köy',
  sehir: 'Şehir',
  iptal: 'İptal',
  takas: 'Banka Takası',
  puan: 'Puan',
  enUzunYol: 'En Uzun Yol',
  kervanciTasi: 'Kervancıyı taşımak için bir araziye tıkla',
  yeniOyun: 'Yeni Oyun',
  kidMode: 'Çocuk Modu (kart atma/çalma yok)',
  oyuncuSayisi: 'Oyuncu sayısı',
  hedefPuan: 'Hedef puan',
  basla: 'Oyunu Başlat',
  ver: 'Ver',
  al: 'Al',
};
