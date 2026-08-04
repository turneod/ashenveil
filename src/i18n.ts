// Türkçe metinler ve etiketler (görsel öğeler artık SVG ikon — bkz. render/icons.ts).

import type { Resource, TerrainType, DevCardType } from './game/types';

export const RES_AD: Record<Resource, string> = {
  odun: 'Odun', tugla: 'Tuğla', yun: 'Yün', bugday: 'Buğday', tas: 'Taş',
};

export const TERRAIN_AD: Record<TerrainType, string> = {
  odun: 'Orman', tugla: 'Ocak', yun: 'Otlak', bugday: 'Tarla', tas: 'Dağ', col: 'Çöl',
};

export const TERRAIN_RENK: Record<TerrainType, string> = {
  odun: '#2f7d32', tugla: '#c1592f', yun: '#8fce6b', bugday: '#e8c04b', tas: '#9aa3ab', col: '#e4d5a8',
};

export const DEV_AD: Record<DevCardType, string> = {
  sovalye: 'Şövalye', yolYapimi: 'Yol Yapımı', bereketYili: 'Bereket Yılı', tekel: 'Tekel', zafer: 'Zafer Puanı',
};

/** Gelişim kartı -> ikon adı (render/icons.ts). */
export const DEV_ICON: Record<DevCardType, string> = {
  sovalye: 'sovalye', yolYapimi: 'yolkart', bereketYili: 'bereketkart', tekel: 'tekel', zafer: 'zafer',
};

export const PACK_AD: Record<'gorev' | 'olay' | 'liman', string> = {
  gorev: 'Görev Kartları', olay: 'Olay Kartları', liman: 'Liman Ustası',
};

export const PACK_DESC: Record<'gorev' | 'olay' | 'liman', string> = {
  gorev: 'Her oyuncuya gizli hedef; tamamlayınca +2 puan.',
  olay: 'Bazı zar atışlarında sürpriz olaylar olur.',
  liman: 'Liman sahibi tüm kaynaklarda en az 3:1 takas yapar.',
};

export const UI = {
  baslik: 'Bereket Vadisi',
  zarAt: 'Zar At',
  turuBitir: 'Turu Bitir',
  yol: 'Yol',
  koy: 'Köy',
  sehir: 'Şehir',
  takas: 'Banka Takası',
  puan: 'Puan',
  enUzunYol: 'En Uzun Yol',
  enBuyukOrdu: 'En Büyük Ordu',
  kervanciTasi: 'Kervancıyı taşımak için bir araziye tıkla',
  yeniOyun: 'Yeni Oyun',
  kidMode: 'Çocuk Modu (kart atma/çalma yok)',
  oyuncuSayisi: 'Oyuncu sayısı',
  hedefPuan: 'Hedef puan',
  basla: 'Oyunu Başlat',
  ver: 'Ver',
  al: 'Al',
  kartAl: 'Kart Al',
  gelisim: 'Gelişim Kartları',
  paketler: 'Ek Paketler',
};
