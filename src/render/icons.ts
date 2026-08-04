// Tüm SVG ikonlar tek yerde (emoji yok). Kaynak ikonları çok renkli;
// arayüz/kart ikonları currentColor kullanır, böylece CSS ile renklenir.

import type { Resource } from '../game/types';

const NS = 'http://www.w3.org/2000/svg';

/** Kaynak ikonlarının iç SVG'si (24x24 kutu, çok renkli). */
export const RES_GLYPH: Record<Resource, string> = {
  odun: `<polygon points="12,3 6.5,11 17.5,11" fill="#3a9a4a"/>
    <polygon points="12,7.5 5,17 19,17" fill="#2f7d3c"/>
    <rect x="10.3" y="16" width="3.4" height="5.5" rx="1" fill="#7a4a24"/>`,
  tugla: `<rect x="3" y="7" width="18" height="10" rx="1.5" fill="#c1592f" stroke="#8a3b1c" stroke-width="1.1"/>
    <path d="M3 12 H21 M12 7 V12 M7 12 V17 M17 12 V17" stroke="#8a3b1c" stroke-width="1.1" fill="none"/>`,
  yun: `<g fill="#f6f4ef" stroke="#c9bea6" stroke-width="1">
      <circle cx="8" cy="13" r="4"/><circle cx="12" cy="10.5" r="4.2"/><circle cx="15" cy="13.5" r="4"/><circle cx="10.5" cy="15" r="4"/>
    </g>
    <circle cx="16.5" cy="11.5" r="3.1" fill="#4a4038"/>
    <circle cx="15.6" cy="11" r="0.7" fill="#fff"/>
    <rect x="6" y="18.5" width="1.4" height="3" fill="#4a4038"/><rect x="15.5" y="18.5" width="1.4" height="3" fill="#4a4038"/>`,
  bugday: `<path d="M12 22 V8" stroke="#a9761f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <g fill="#e9b943" stroke="#b9862a" stroke-width="0.7">
      <path d="M12 8 q-4 0.5 -4.5 4 q4 -0.5 4.5 -4Z"/>
      <path d="M12 8 q4 0.5 4.5 4 q-4 -0.5 -4.5 -4Z"/>
      <path d="M12 12 q-4 0.5 -4.5 4 q4 -0.5 4.5 -4Z"/>
      <path d="M12 12 q4 0.5 4.5 4 q-4 -0.5 -4.5 -4Z"/>
      <path d="M12 5 q-2 1 -2 3.5 q2 -1 2 -3.5Z"/><path d="M12 5 q2 1 2 3.5 q-2 -1 -2 -3.5Z"/>
    </g>`,
  tas: `<polygon points="3,19 10,7 14,13 17,9 21,19" fill="#8a949e" stroke="#5c6772" stroke-width="1"/>
    <polygon points="10,7 7.6,11 12.4,11" fill="#eef2f4"/>
    <polygon points="17,9 15,12 19,12" fill="#eef2f4"/>`,
};

/** Arayüz ve kart ikonları (24x24, currentColor). */
export const UI_GLYPH: Record<string, string> = {
  zar: `<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="8.5" cy="8.5" r="1.7" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.7" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.7" fill="currentColor"/>
    <circle cx="15.5" cy="15.5" r="1.7" fill="currentColor"/>`,
  cihaz: `<rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="10" y1="18.5" x2="14" y2="18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  wifi: `<path d="M4 9 q8 -6 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 12.5 q5 -3.5 10 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 16 q2 -1.4 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="19" r="1.4" fill="currentColor"/>`,
  link: `<path d="M9 15 L15 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M10.5 7.5 L13 5 a3.5 3.5 0 0 1 5 5 l-2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M13.5 16.5 L11 19 a3.5 3.5 0 0 1 -5 -5 l2.5 -2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  kart: `<rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="4" y1="9.5" x2="20" y2="9.5" stroke="currentColor" stroke-width="1.6"/>
    <circle cx="7.5" cy="7.2" r="0.9" fill="currentColor"/>`,
  sovalye: `<path d="M12 3 C8 3 6 6 6 10 v3 c0 3 2 5 6 5 s6 -2 6 -5 v-3 c0 -4 -2 -7 -6 -7Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="6.5" y1="11" x2="17.5" y2="11" stroke="currentColor" stroke-width="1.8"/>
    <line x1="12" y1="11" x2="12" y2="18" stroke="currentColor" stroke-width="1.8"/>`,
  yolkart: `<path d="M4 20 L10 4 M20 20 L14 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2.5" stroke-linecap="round"/>`,
  bereketkart: `<path d="M6 12 h12 l-2 7 h-8 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M6 12 q0 -5 6 -6 q-2 3 -2 6" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="14" cy="9" r="1.4" fill="currentColor"/><circle cx="17" cy="11" r="1.4" fill="currentColor"/>`,
  tekel: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12 h8 M13 9 l3 3 -3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  zafer: `<polygon points="12,3 14.6,9 21,9.5 16,13.7 17.6,20 12,16.5 6.4,20 8,13.7 3,9.5 9.4,9" fill="currentColor"/>`,
  gorev: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor"/>`,
  olay: `<path d="M13 2 L5 13 h5 l-2 9 9 -12 h-5 Z" fill="currentColor"/>`,
  liman: `<circle cx="12" cy="5.5" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="7.5" x2="12" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 14 a7 7 0 0 0 14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  kupa: `<path d="M8 4 h8 v4 a4 4 0 0 1 -8 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M8 5 H5 a3 3 0 0 0 3 3 M16 5 h3 a3 3 0 0 1 -3 3" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
    <path d="M8.5 20 h7 l-1 -4 h-5 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  yolmadalya: `<circle cx="12" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M9 3 l3 5 3 -5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2" stroke-linecap="round"/>`,
  banka: `<path d="M4 9 L12 4 L20 9 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <line x1="6" y1="10" x2="6" y2="17" stroke="currentColor" stroke-width="2"/><line x1="12" y1="10" x2="12" y2="17" stroke="currentColor" stroke-width="2"/>
    <line x1="18" y1="10" x2="18" y2="17" stroke="currentColor" stroke-width="2"/><line x1="4" y1="19" x2="20" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  takas: `<path d="M6 8 h11 l-3 -3 M18 16 H7 l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  puan: `<polygon points="12,3 14.6,9 21,9.5 16,13.7 17.6,20 12,16.5 6.4,20 8,13.7 3,9.5 9.4,9" fill="currentColor"/>`,
};

function build(inner: string, size: number, cls: string): SVGSVGElement {
  const el = document.createElementNS(NS, 'svg') as SVGSVGElement;
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('class', cls);
  el.innerHTML = inner;
  return el;
}

export function resIcon(r: Resource, size = 18): SVGSVGElement {
  return build(RES_GLYPH[r], size, 'ricon');
}

export function uiIcon(name: string, size = 18): SVGSVGElement {
  return build(UI_GLYPH[name] ?? '', size, 'uicon');
}

/** Bir kaynağın SVG içi çizimini, tahtaya gömmek için <g transform> ile döndürür. */
export function resourceGlyphAt(r: Resource, x: number, y: number, size: number): string {
  const s = size / 24;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${s})">${RES_GLYPH[r]}</g>`;
}
