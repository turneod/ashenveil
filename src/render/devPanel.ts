// Gelişim kartları paneli: kart al + elindekileri oyna (Şövalye, Yol Yapımı,
// Bereket Yılı [2 kaynak seç], Tekel [1 kaynak seç], Zafer [bilgi]).

import type { GameState, Resource, DevCardType } from '../game/types';
import { RESOURCES, DEV_COST } from '../game/types';
import { canBuyDev } from '../game/state';
import { DEV_AD, DEV_ICON, RES_AD, UI } from '../i18n';
import { resIcon, uiIcon } from './icons';

export interface DevActions {
  onBuyDev: () => void;
  onPlayKnight: () => void;
  onPlayRoadBuilding: () => void;
  onPlayPlenty: (r1: Resource, r2: Resource) => void;
  onPlayMonopoly: (r: Resource) => void;
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

export function renderDevPanel(state: GameState, a: DevActions): HTMLElement {
  const p = state.players[state.current];
  const box = h('div', { class: 'dev' });
  let picking: 'plenty' | 'monopoly' | null = null;
  let plentyPick: Resource[] = [];

  const body = h('div', { class: 'dev-body' });
  box.append(h('div', { class: 'dev-title' }, uiIcon('kart', 16), UI.gelisim), body);

  const newCount = (t: DevCardType) => p.devNew.filter((x) => x === t).length;
  const canPlay = (t: DevCardType) => !p.playedDevThisTurn && p.dev[t] - newCount(t) > 0;

  function costIcons(): HTMLElement {
    const row = h('span', { class: 'mini-cost' });
    for (const r of Object.keys(DEV_COST) as Resource[]) row.append(resIcon(r, 15));
    return row;
  }

  function cardButton(t: DevCardType, onPlay: (() => void) | null): HTMLElement {
    const playable = onPlay !== null && canPlay(t);
    const btn = h('button', {
      class: `devcard${playable ? ' playable' : ''}`,
      disabled: onPlay === null ? false : !playable,
      title: DEV_AD[t],
      onclick: () => { if (onPlay && playable) onPlay(); },
    }, uiIcon(DEV_ICON[t], 22), h('span', { class: 'dc-name' }, DEV_AD[t]), h('span', { class: 'dc-n' }, `×${p.dev[t]}`));
    return btn;
  }

  function resPicker(label: string, onPick: (r: Resource) => void, picks: Resource[]): HTMLElement {
    const wrap = h('div', { class: 'dev-picker' }, h('span', { class: 'tlbl' }, label));
    const row = h('div', { class: 'chip-row' });
    for (const r of RESOURCES) {
      row.append(h('button', { class: 'chip', title: RES_AD[r], onclick: () => onPick(r) }, resIcon(r, 20)));
    }
    wrap.append(row);
    if (picks.length) wrap.append(h('div', { class: 'picked' }, ...picks.map((r) => resIcon(r, 18))));
    return wrap;
  }

  function paint(): void {
    body.replaceChildren();

    // Kart Al
    const buy = h('button', {
      class: 'btn small full', disabled: !canBuyDev(state), onclick: a.onBuyDev,
    }, uiIcon('kart', 16), `${UI.kartAl} `, costIcons(), h('span', { class: 'deck-n' }, `(${state.devDeck.length})`));
    body.append(buy);

    // Elindeki kartlar
    const held = (['sovalye', 'yolYapimi', 'bereketYili', 'tekel', 'zafer'] as DevCardType[]).filter((t) => p.dev[t] > 0);
    if (held.length) {
      const grid = h('div', { class: 'dev-grid' });
      for (const t of held) {
        if (t === 'sovalye') grid.append(cardButton(t, a.onPlayKnight));
        else if (t === 'yolYapimi') grid.append(cardButton(t, a.onPlayRoadBuilding));
        else if (t === 'bereketYili') grid.append(cardButton(t, () => { picking = 'plenty'; plentyPick = []; paint(); }));
        else if (t === 'tekel') grid.append(cardButton(t, () => { picking = 'monopoly'; paint(); }));
        else grid.append(cardButton(t, null)); // zafer: bilgi
      }
      body.append(grid);
    }

    if (picking === 'plenty') {
      body.append(resPicker('Bereket Yılı: 2 kaynak seç', (r) => {
        plentyPick.push(r);
        if (plentyPick.length === 2) { a.onPlayPlenty(plentyPick[0], plentyPick[1]); picking = null; }
        paint();
      }, plentyPick));
    } else if (picking === 'monopoly') {
      body.append(resPicker('Tekel: bir kaynak seç', (r) => { a.onPlayMonopoly(r); picking = null; }, []));
    }
  }

  paint();
  return box;
}
