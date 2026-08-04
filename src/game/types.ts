// Bereket Vadisi — çekirdek tipler ve sabitler

/** Üretilebilen 5 kaynak. */
export type Resource = 'odun' | 'tugla' | 'yun' | 'bugday' | 'tas';

/** Arazi türü: bir kaynak ya da çöl (üretmez, kervancının başlangıcı). */
export type TerrainType = Resource | 'col';

/** Liman türü: 'genel' = 3:1 her kaynak, ya da belirli bir kaynak için 2:1. */
export type PortType = 'genel' | Resource;

/** İnşa edilebilen parçalar. */
export type BuildingType = 'koy' | 'sehir';

/** Gelişim kartı türleri (oyunun aslına dahil). */
export type DevCardType = 'sovalye' | 'yolYapimi' | 'bereketYili' | 'tekel' | 'zafer';

/** Görev (gizli hedef) kartı türleri — 'Görev Kartları' paketi. */
export type ObjectiveId = 'yollar' | 'cesitlilik' | 'sehirler' | 'liman' | 'buyukKoy';

/** Seçmeli paketler (gelişim kartları her zaman açıktır). */
export interface PackConfig {
  gorev: boolean; // Görev / Hedef kartları
  olay: boolean; // Olay kartları
  liman: boolean; // Liman ustası
}

/** Oyun fazları. */
export type Phase =
  | 'kurulum' // başlangıç yerleştirmesi (yılan sırası)
  | 'zar' // sıradaki oyuncu zar atmalı
  | 'aksiyon' // zar atıldı; ticaret / inşaat / turu bitir
  | 'kervanci' // 7 atıldı, kervancı taşınacak
  | 'bitti'; // oyun bitti

/** Altıgen arazi karosu. */
export interface Tile {
  id: number;
  q: number;
  r: number;
  cx: number;
  cy: number;
  terrain: TerrainType;
  /** Zar jetonu (2-12), çölde null. */
  token: number | null;
  /** 6 köşe vertex id'si. */
  corners: number[];
}

/** Yol/köylerin oturduğu köşe noktası. */
export interface Vertex {
  id: number;
  x: number;
  y: number;
  tiles: number[];
  neighbors: number[]; // komşu vertex id'leri (bir kenar ile bağlı)
  edges: number[];
  port: PortType | null;
}

/** İki köşe arasındaki kenar (yol buraya oturur). */
export interface Edge {
  id: number;
  a: number;
  b: number;
  x: number; // orta nokta (çizim/tık için)
  y: number;
  tiles: number[];
}

export interface Building {
  type: BuildingType;
  owner: number; // oyuncu indeksi
}

export interface Player {
  id: number;
  name: string;
  color: string;
  resources: Record<Resource, number>;
  dev: Record<DevCardType, number>; // elindeki gelişim kartları
  devNew: DevCardType[]; // bu tur alındı (bu tur oynanamaz)
  knights: number; // oynanmış şövalye sayısı (En Büyük Ordu)
  playedDevThisTurn: boolean; // tur başına 1 gelişim kartı
  objective: ObjectiveId | null; // gizli görev (Görev paketi)
  objectiveDone: boolean;
}

export interface GameState {
  players: Player[];
  tiles: Tile[];
  vertices: Vertex[];
  edges: Edge[];
  buildings: Record<number, Building>; // vertexId -> bina
  roads: Record<number, number>; // edgeId -> sahip (oyuncu indeksi)
  robber: number; // kervancının olduğu tile id
  current: number; // sıradaki oyuncu indeksi
  phase: Phase;
  dice: [number, number] | null;
  targetScore: number;
  kidMode: boolean;
  // kurulum defteri
  setupOrder: number[]; // kalan yerleştirmeler (oyuncu indeksleri, sıralı)
  setupSubStage: 'koy' | 'yol';
  setupLastVertex: number | null;
  longestRoad: { owner: number | null; length: number };
  largestArmy: { owner: number | null; size: number };
  winner: number | null;
  trade: TradeOffer | null; // bekleyen oyuncular arası takas teklifi
  devDeck: DevCardType[]; // gelişim kartı destesi
  freeRoads: number; // Yol Yapımı kartı: bedava yol sayacı
  packs: PackConfig;
  lastEvent: string | null; // son olay kartı açıklaması (Olay paketi)
  log: string[];
}

/** Bir oyuncunun başka bir oyuncuya sunduğu takas teklifi. */
export interface TradeOffer {
  from: number; // teklif eden (sırası gelen oyuncu)
  to: number; // teklif edilen rakip
  give: Partial<Record<Resource, number>>; // from -> to
  want: Partial<Record<Resource, number>>; // to -> from
}

/** İnşaat maliyetleri (tanıdıklık için Catan ile aynı). */
export const COSTS: Record<'yol' | 'koy' | 'sehir', Partial<Record<Resource, number>>> = {
  yol: { odun: 1, tugla: 1 },
  koy: { odun: 1, tugla: 1, yun: 1, bugday: 1 },
  sehir: { bugday: 2, tas: 3 },
};

export const RESOURCES: Resource[] = ['odun', 'tugla', 'yun', 'bugday', 'tas'];

/** Oyuncu renkleri (en fazla 4 oyuncu). */
export const PLAYER_COLORS = ['#d64545', '#3b7dd8', '#e8a93b', '#4c9a52'];

/** Gelişim kartı maliyeti. */
export const DEV_COST: Partial<Record<Resource, number>> = { yun: 1, bugday: 1, tas: 1 };

export const KOY_PUAN = 1;
export const SEHIR_PUAN = 2;
export const EN_UZUN_YOL_PUAN = 2;
export const EN_UZUN_YOL_ESIK = 5; // en az bu kadar yol
export const EN_BUYUK_ORDU_PUAN = 2;
export const EN_BUYUK_ORDU_ESIK = 3; // en az bu kadar şövalye
export const ZAFER_KART_PUAN = 1;
export const GOREV_PUAN = 2; // görev tamamlama bonusu

/** Gelişim destesi kompozisyonu. */
export const DEV_DECK: DevCardType[] = [
  ...Array<DevCardType>(10).fill('sovalye'),
  ...Array<DevCardType>(3).fill('zafer'),
  ...Array<DevCardType>(2).fill('yolYapimi'),
  ...Array<DevCardType>(2).fill('bereketYili'),
  ...Array<DevCardType>(2).fill('tekel'),
];
