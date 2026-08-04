// Takas paneli: 🏦 Banka (limanlara göre oran) ve 🤝 Oyuncu (rakibe teklif).
// Kendi seçim durumunu tutar; oyun durumu ancak "Değiştir"/"Teklif Et" ile değişir.

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

export function renderTradePanel(state: GameState, actions: TradeActions): HTMLElement {
  const me = state.current;
  const box = h('div', { class: 'trade' });

  let mode: 'banka' | 'oyuncu' = 'banka';
  let bankGive: Resource | null = null;
  let bankRecv: Resource | null = null;
  let target: number | null = null;
  const give: Record<Resource, number> = { odun: 0, tugla: 0, yun: 0, bugday: 0, tas: 0 };
  const want: Record<Resource, number> = { odun: 0, tugla: 0, yun: 0, bugday: 0, tas: 0 };

  const body = h('div', { class: 'trade-body' });

  const tabs = h('div', { class: 'seg' });
  box.append(tabs, body);

  function tab(iconName: string, label: string, active: boolean, on: () => void): HTMLElement {
    return h('button', { class: `seg-btn${active ? ' on' : ''}`, onclick: on }, uiIcon(iconName, 16), label);
  }

  function paintTabs(): void {
    tabs.replaceChildren(
      tab('banka', 'Banka', mode === 'banka', () => { mode = 'banka'; paint(); }),
      tab('takas', 'Oyuncu', mode === 'oyuncu', () => { mode = 'oyuncu'; paint(); }),
    );
  }

  function resChips(selected: Resource | null, pick: (r: Resource) => void): HTMLElement {
    const row = h('div', { class: 'chip-row' });
    for (const r of RESOURCES) {
      row.append(h('button', {
        class: `chip${selected === r ? ' on' : ''}`, title: RES_AD[r], onclick: () => pick(r),
      }, resIcon(r, 20)));
    }
    return row;
  }

  function stepper(store: Record<Resource, number>, maxOf: (r: Resource) => number): HTMLElement {
    const grid = h('div', { class: 'step-grid' });
    for (const r of RESOURCES) {
      const count = h('span', { class: 'sc' }, String(store[r]));
      const dec = h('button', { class: 'sbtn', onclick: () => { if (store[r] > 0) { store[r]--; count.textContent = String(store[r]); refreshButtons(); } } }, '−');
      const inc = h('button', { class: 'sbtn', onclick: () => { if (store[r] < maxOf(r)) { store[r]++; count.textContent = String(store[r]); refreshButtons(); } } }, '+');
      grid.append(h('div', { class: 'step-cell' },
        resIcon(r, 20),
        h('div', { class: 'step-row' }, dec, count, inc),
      ));
    }
    return grid;
  }

  let actBtn: HTMLElement;

  function refreshButtons(): void {
    if (mode === 'banka') {
      const ok = !!bankGive && !!bankRecv && canBankTrade(state, me, bankGive, bankRecv);
      actBtn.toggleAttribute('disabled', !ok);
    } else {
      const g = RESOURCES.reduce((s, r) => s + give[r], 0);
      const w = RESOURCES.reduce((s, r) => s + want[r], 0);
      actBtn.toggleAttribute('disabled', !(target !== null && (g > 0 || w > 0)));
    }
  }

  function paint(): void {
    paintTabs();
    body.replaceChildren();

    if (mode === 'banka') {
      const ratioLbl = h('span', { class: 'ratio' }, bankGive ? `${tradeRatio(state, me, bankGive)}:1` : '4:1');
      body.append(
        h('div', { class: 'trow' }, h('span', { class: 'tlbl' }, 'Ver'), resChips(bankGive, (r) => { bankGive = r; paint(); }), ratioLbl),
        h('div', { class: 'trow' }, h('span', { class: 'tlbl' }, 'Al'), resChips(bankRecv, (r) => { bankRecv = r; paint(); })),
      );
      actBtn = h('button', { class: 'btn small full', onclick: () => { if (bankGive && bankRecv) actions.onBankTrade(bankGive, bankRecv); } }, 'Değiştir');
    } else {
      const opp = h('div', { class: 'chip-row' });
      state.players.forEach((p, i) => {
        if (i === me) return;
        const b = h('button', { class: `chip pchip${target === i ? ' on' : ''}`, onclick: () => { target = i; paint(); } }, p.name);
        b.style.setProperty('--pc', p.color);
        opp.append(b);
      });
      body.append(
        h('div', { class: 'trow' }, h('span', { class: 'tlbl' }, 'Kime'), opp),
        h('div', { class: 'tlbl2' }, 'Veriyorsun'), stepper(give, (r) => state.players[me].resources[r]),
        h('div', { class: 'tlbl2' }, 'İstiyorsun'), stepper(want, () => 9),
      );
      actBtn = h('button', {
        class: 'btn small full', onclick: () => {
          if (target === null) return;
          actions.onProposeTrade(target, nonZero(give), nonZero(want));
        },
      }, 'Teklif Et');
    }
    body.append(actBtn);
    refreshButtons();
  }

  paint();
  return box;
}

function nonZero(m: Record<Resource, number>): Partial<Record<Resource, number>> {
  const out: Partial<Record<Resource, number>> = {};
  for (const r of RESOURCES) if (m[r] > 0) out[r] = m[r];
  return out;
}
