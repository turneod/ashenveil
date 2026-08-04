// Takas paneli: Banka (limanlara göre oran) ve Oyuncu (rakibe teklif).
// Oyuncu takası adım adım yönlendirir: rakip seç → vereceğine dokun → istediğine dokun.
// Kendi seçim durumunu tutar; oyun durumu ancak butonla değişir.

import type { GameState, Resource } from '../game/types';
import { RESOURCES } from '../game/types';
import { tradeRatio, canBankTrade } from '../game/rules';
import { RES_AD } from '../i18n';
import { resIcon, uiIcon } from './icons';

export interface TradeActions {
  onBankTrade: (give: Resource, receive: Resource) => void;
  onProposeTrade: (to: number, give: Partial<Record<Resource, number>>, want: Partial<Record<Resource, number>>) => void;
}

function h(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = String(v);
    else if (k === 'onclick') e.addEventListener('click', v as EventListener);
    else if (k === 'disabled') { if (v) e.setAttribute('disabled', 'true'); }
    else e.setAttribute(k, String(v));
  }
  for (const kid of kids) e.append(kid);
  return e;
}

const empty = (): Record<Resource, number> => ({ odun: 0, tugla: 0, yun: 0, bugday: 0, tas: 0 });
const total = (m: Record<Resource, number>) => RESOURCES.reduce((s, r) => s + m[r], 0);
const nonZero = (m: Record<Resource, number>): Partial<Record<Resource, number>> => {
  const o: Partial<Record<Resource, number>> = {};
  for (const r of RESOURCES) if (m[r] > 0) o[r] = m[r];
  return o;
};

export function renderTradePanel(state: GameState, actions: TradeActions): HTMLElement {
  const me = state.current;
  const box = h('div', { class: 'trade' });

  let mode: 'banka' | 'oyuncu' = 'banka';
  let bankGive: Resource | null = null;
  let bankRecv: Resource | null = null;
  let target: number | null = null;
  const give = empty();
  const want = empty();

  const tabs = h('div', { class: 'seg' });
  const body = h('div', { class: 'trade-body' });
  box.append(tabs, body);

  function paintTabs(): void {
    tabs.replaceChildren(
      h('button', { class: `seg-btn${mode === 'banka' ? ' on' : ''}`, onclick: () => { mode = 'banka'; paint(); } }, uiIcon('banka', 16), 'Banka'),
      h('button', { class: `seg-btn${mode === 'oyuncu' ? ' on' : ''}`, onclick: () => { mode = 'oyuncu'; paint(); } }, uiIcon('takas', 16), 'Oyuncu'),
    );
  }

  // ---- Banka ----
  function resChips(selected: Resource | null, pick: (r: Resource) => void): HTMLElement {
    const row = h('div', { class: 'chip-row' });
    for (const r of RESOURCES) {
      row.append(h('button', { class: `chip${selected === r ? ' on' : ''}`, title: RES_AD[r], onclick: () => pick(r) }, resIcon(r, 20)));
    }
    return row;
  }

  // ---- Oyuncu: kaynağa dokun → sepete ekle ----
  function addRow(store: Record<Resource, number>, maxOf: (r: Resource) => number, showHold: boolean): HTMLElement {
    const row = h('div', { class: 'add-row' });
    for (const r of RESOURCES) {
      const hold = state.players[me].resources[r];
      const dis = showHold && hold <= 0;
      const coin = h('button', {
        class: 'coin', title: RES_AD[r], disabled: dis,
        onclick: () => { if (store[r] < maxOf(r)) { store[r] += 1; paint(); } },
      }, resIcon(r, 22));
      if (showHold) coin.append(h('span', { class: 'hold' }, String(hold)));
      row.append(coin);
    }
    return row;
  }

  function basket(store: Record<Resource, number>, hint: string): HTMLElement {
    const keys = RESOURCES.filter((r) => store[r] > 0);
    if (keys.length === 0) return h('div', { class: 'basket empty' }, hint);
    const b = h('div', { class: 'basket' });
    for (const r of keys) {
      b.append(h('button', { class: 'bchip', title: 'Çıkar', onclick: () => { store[r] -= 1; paint(); } }, resIcon(r, 16), `×${store[r]}`));
    }
    return b;
  }

  function dot(i: number): HTMLElement {
    const d = h('span', { class: 'dot2' });
    d.style.background = state.players[i].color;
    return d;
  }

  function miniChips(store: Record<Resource, number>): HTMLElement {
    const keys = RESOURCES.filter((r) => store[r] > 0);
    if (keys.length === 0) return h('span', { class: 'mc-empty' }, '—');
    const s = h('span', { class: 'mc' });
    for (const r of keys) { s.append(resIcon(r, 15)); if (store[r] > 1) s.append(h('span', { class: 'mc-n' }, `×${store[r]}`)); }
    return s;
  }

  function step(n: string, label: string): HTMLElement {
    return h('div', { class: 'trade-step' }, h('span', { class: 'step-num' }, n), label);
  }

  function paint(): void {
    paintTabs();
    body.replaceChildren();

    if (mode === 'banka') {
      const ratio = bankGive ? tradeRatio(state, me, bankGive) : 4;
      body.append(
        h('div', { class: 'trow' }, h('span', { class: 'tlbl' }, 'Ver'), resChips(bankGive, (r) => { bankGive = r; paint(); }), h('span', { class: 'ratio' }, `${ratio}:1`)),
        h('div', { class: 'trow' }, h('span', { class: 'tlbl' }, 'Al'), resChips(bankRecv, (r) => { bankRecv = r; paint(); })),
      );
      const ok = !!bankGive && !!bankRecv && canBankTrade(state, me, bankGive, bankRecv);
      body.append(h('button', { class: 'btn small full', disabled: !ok, onclick: () => { if (bankGive && bankRecv) actions.onBankTrade(bankGive, bankRecv); } }, 'Değiştir'));
      return;
    }

    // Oyuncu takası — yönlendirmeli
    // 1) Kime?
    body.append(step('1', 'Kime teklif?'));
    const opp = h('div', { class: 'chip-row' });
    state.players.forEach((p, i) => {
      if (i === me) return;
      const b = h('button', { class: `chip pchip${target === i ? ' on' : ''}`, onclick: () => { target = i; paint(); } }, dot(i), p.name);
      opp.append(b);
    });
    body.append(opp);

    // 2) Ne verirsin?
    body.append(step('2', 'Sen ne verirsin?'));
    body.append(addRow(give, (r) => state.players[me].resources[r], true));
    body.append(basket(give, 'Elindekilere dokun'));

    // 3) Ne istersin?
    body.append(step('3', 'Karşılığında ne istersin?'));
    body.append(addRow(want, () => 9, false));
    body.append(basket(want, 'İstediğin kaynaklara dokun'));

    // Önizleme + gönder
    const preview = h('div', { class: 'deal' },
      dot(me), miniChips(give), uiIcon('takas', 15), miniChips(want),
      target !== null ? dot(target) : h('span', { class: 'q' }, '?'));
    body.append(preview);

    const ready = target !== null && (total(give) > 0 || total(want) > 0);
    body.append(h('div', { class: 'trade-actions' },
      h('button', {
        class: 'btn primary small', style: 'flex:1', disabled: !ready,
        onclick: () => { if (target !== null) actions.onProposeTrade(target, nonZero(give), nonZero(want)); },
      }, 'Teklif Gönder'),
      h('button', { class: 'btn small', onclick: () => { RESOURCES.forEach((r) => { give[r] = 0; want[r] = 0; }); target = null; paint(); } }, 'Temizle'),
    ));
  }

  paint();
  return box;
}
