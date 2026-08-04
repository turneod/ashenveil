// Yan panel arayüzü: oyuncu kartları, zar, aksiyon butonları, banka takası, kayıt (log).

import type { GameState, Resource } from '../game/types';
import { COSTS, RESOURCES } from '../game/types';
import { score, resourceCount, tradeRatio, hasResources } from '../game/rules';
import { RES_AD, RES_EMOJI, UI } from '../i18n';

export type BuildMode = 'yol' | 'koy' | 'sehir' | null;

export interface HudActions {
  buildMode: BuildMode;
  onRoll: () => void;
  onBuild: (mode: BuildMode) => void;
  onBankTrade: (give: Resource, receive: Resource) => void;
  onEndTurn: () => void;
  onNewGame: () => void;
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

function costText(mode: 'yol' | 'koy' | 'sehir'): string {
  const c = COSTS[mode];
  return (Object.keys(c) as Resource[])
    .map((r) => RES_EMOJI[r].repeat(c[r] ?? 0))
    .join('');
}

export interface HudView {
  viewerSeat: number; // bu istemcinin kendi eli açık gösterilir
  myTurn: boolean; // bu istemci şu an oynayabilir mi
}

export function renderHUD(state: GameState, a: HudActions, view: HudView): HTMLElement {
  const panel = h('div', { class: 'hud' });
  panel.append(h('h1', { class: 'title' }, `🌾 ${UI.baslik}`));

  // Faz ipucu
  panel.append(h('div', { class: 'phase-hint' }, phaseHint(state)));

  // Oyuncu kartları
  const list = h('div', { class: 'players' });
  state.players.forEach((p, i) => {
    const active = i === state.current && state.phase !== 'bitti';
    const isMe = i === view.viewerSeat;
    const card = h('div', { class: `player-card${active ? ' active' : ''}${state.winner === i ? ' winner' : ''}` });
    card.style.setProperty('--pc', p.color);
    const head = h('div', { class: 'player-head' },
      h('span', { class: 'swatch' }),
      h('span', { class: 'pname' }, p.name + (isMe ? ' (sen)' : '')),
      h('span', { class: 'pscore' }, `${score(state, i)} ${UI.puan}`),
    );
    card.append(head);
    if (state.longestRoad.owner === i) card.append(h('div', { class: 'badge' }, `🛤️ ${UI.enUzunYol}`));
    // Kaynak: kendi elin açık; diğerleri sadece kart sayısı.
    if (isMe) {
      const hand = h('div', { class: 'hand' });
      for (const r of RESOURCES) {
        hand.append(h('span', { class: 'res', title: RES_AD[r] }, `${RES_EMOJI[r]} ${p.resources[r]}`));
      }
      card.append(hand);
    } else {
      card.append(h('div', { class: 'hand muted' }, `🎴 ${resourceCount(p)} kart`));
    }
    list.append(card);
  });
  panel.append(list);

  // Aksiyon alanı
  panel.append(actionArea(state, a, view));

  // Kayıt
  const log = h('div', { class: 'log' });
  for (const line of state.log.slice(0, 8)) log.append(h('div', { class: 'log-line' }, line));
  panel.append(log);

  return panel;
}

function phaseHint(state: GameState): string {
  const cur = state.players[state.current]?.name ?? '';
  switch (state.phase) {
    case 'kurulum':
      return state.setupSubStage === 'koy'
        ? `${cur}: bir köy yeri seç (parlayan noktalar).`
        : `${cur}: köyüne bitişik bir yol seç.`;
    case 'zar':
      return `${cur}: zar atma sırası sende.`;
    case 'aksiyon':
      return `${cur}: inşa et, takas yap ya da turu bitir.`;
    case 'kervanci':
      return UI.kervanciTasi + '.';
    case 'bitti':
      return state.winner !== null ? `🎉 ${state.players[state.winner].name} kazandı!` : 'Oyun bitti.';
  }
}

function actionArea(state: GameState, a: HudActions, view: HudView): HTMLElement {
  const box = h('div', { class: 'actions' });

  if (state.phase === 'bitti') {
    box.append(h('button', { class: 'btn primary', onclick: a.onNewGame }, UI.yeniOyun));
    return box;
  }

  // Sıra bende değilse (çevrimiçi): sadece bekleme mesajı.
  if (!view.myTurn) {
    if (state.dice) box.append(h('div', { class: 'dice' }, diceFace(state.dice[0]), diceFace(state.dice[1])));
    box.append(h('div', { class: 'waiting' }, `⏳ Sıra ${state.players[state.current].name}'de — bekle.`));
    return box;
  }

  if (state.phase === 'kurulum' || state.phase === 'kervanci') {
    // Yönlendirme tahtada; ekstra buton yok.
    if (state.phase === 'kervanci' && state.dice) {
      box.append(h('div', { class: 'dice' }, diceFace(state.dice[0]), diceFace(state.dice[1])));
    }
    box.append(h('button', { class: 'btn ghost', onclick: a.onNewGame }, UI.yeniOyun));
    return box;
  }
  if (state.phase === 'zar') {
    box.append(h('button', { class: 'btn primary big', onclick: a.onRoll }, UI.zarAt));
    if (state.dice) box.append(h('div', { class: 'dice' }, diceFace(state.dice[0]), diceFace(state.dice[1])));
    return box;
  }

  // aksiyon fazı
  if (state.dice) box.append(h('div', { class: 'dice' }, diceFace(state.dice[0]), diceFace(state.dice[1])));

  const player = state.players[state.current];
  const buildRow = h('div', { class: 'build-row' });
  (['yol', 'koy', 'sehir'] as const).forEach((m) => {
    const label = m === 'yol' ? UI.yol : m === 'koy' ? UI.koy : UI.sehir;
    const can = hasResources(player, COSTS[m]);
    const btn = h('button', {
      class: `btn build${a.buildMode === m ? ' selected' : ''}`,
      disabled: !can,
      onclick: () => a.onBuild(a.buildMode === m ? null : m),
    }, h('span', { class: 'bl' }, label), h('span', { class: 'bc' }, costText(m)));
    buildRow.append(btn);
  });
  box.append(buildRow);

  // Banka takası
  box.append(bankTradeUI(state, a));

  box.append(h('button', { class: 'btn primary', onclick: a.onEndTurn }, UI.turuBitir));
  return box;
}

function bankTradeUI(state: GameState, a: HudActions): HTMLElement {
  const wrap = h('div', { class: 'trade' });
  const give = h('select', { class: 'sel' }) as HTMLSelectElement;
  const recv = h('select', { class: 'sel' }) as HTMLSelectElement;
  for (const r of RESOURCES) {
    give.append(h('option', { value: r }, `${RES_EMOJI[r]} ${RES_AD[r]}`));
    recv.append(h('option', { value: r }, `${RES_EMOJI[r]} ${RES_AD[r]}`));
  }
  recv.selectedIndex = 1;
  const ratioLbl = h('span', { class: 'ratio' });
  const refreshRatio = () => {
    const g = give.value as Resource;
    ratioLbl.textContent = `${tradeRatio(state, state.current, g)}:1`;
  };
  give.addEventListener('change', refreshRatio);
  refreshRatio();
  wrap.append(
    h('div', { class: 'trade-title' }, `${UI.takas} `, ratioLbl),
    h('div', { class: 'trade-row' },
      h('span', { class: 'lbl' }, UI.ver), give,
      h('span', { class: 'lbl' }, UI.al), recv,
      h('button', {
        class: 'btn small',
        onclick: () => a.onBankTrade(give.value as Resource, recv.value as Resource),
      }, '↔'),
    ),
  );
  return wrap;
}

const DICE_PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function diceFace(n: number): HTMLElement {
  return h('span', { class: 'die' }, DICE_PIPS[n] ?? String(n));
}
