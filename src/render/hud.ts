// Yan panel arayüzü: oyuncu kartları, aksiyon butonları, takas (banka + oyuncu),
// takas yanıtı ve kayıt (log). Zar artık tahtanın sol üstünde (bkz. DiceBox).

import type { GameState, Resource, TradeOffer } from '../game/types';
import { COSTS, RESOURCES } from '../game/types';
import { score, resourceCount, hasResources } from '../game/rules';
import { RES_AD, RES_EMOJI, UI } from '../i18n';
import { renderTradePanel } from './tradePanel';

export type BuildMode = 'yol' | 'koy' | 'sehir' | null;

export interface HudActions {
  buildMode: BuildMode;
  onRoll: () => void;
  onBuild: (mode: BuildMode) => void;
  onBankTrade: (give: Resource, receive: Resource) => void;
  onProposeTrade: (to: number, give: Partial<Record<Resource, number>>, want: Partial<Record<Resource, number>>) => void;
  onRespondTrade: (accept: boolean) => void;
  onCancelTrade: () => void;
  onEndTurn: () => void;
  onNewGame: () => void;
}

export interface HudView {
  viewerSeat: number; // kendi eli açık gösterilir
  myTurn: boolean; // normal aksiyonları yapabilir mi
  amResponder: boolean; // bekleyen takas teklifini yanıtlayabilir mi
  amProposer: boolean; // bekleyen teklifin sahibi mi
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
  return (Object.keys(c) as Resource[]).map((r) => RES_EMOJI[r].repeat(c[r] ?? 0)).join('');
}

export function renderHUD(state: GameState, a: HudActions, view: HudView): HTMLElement {
  const panel = h('div', { class: 'hud' });
  panel.append(h('h1', { class: 'title' }, `🌾 ${UI.baslik}`));
  panel.append(h('div', { class: 'phase-hint' }, phaseHint(state)));

  const list = h('div', { class: 'players' });
  state.players.forEach((p, i) => {
    const active = i === state.current && state.phase !== 'bitti';
    const isMe = i === view.viewerSeat;
    const card = h('div', { class: `player-card${active ? ' active' : ''}${state.winner === i ? ' winner' : ''}` });
    card.style.setProperty('--pc', p.color);
    card.append(h('div', { class: 'player-head' },
      h('span', { class: 'swatch' }),
      h('span', { class: 'pname' }, p.name + (isMe ? ' (sen)' : '')),
      h('span', { class: 'pscore' }, `${score(state, i)} ${UI.puan}`),
    ));
    if (state.longestRoad.owner === i) card.append(h('div', { class: 'badge' }, `🛤️ ${UI.enUzunYol}`));
    if (isMe) {
      const hand = h('div', { class: 'hand' });
      for (const r of RESOURCES) hand.append(h('span', { class: 'res', title: RES_AD[r] }, `${RES_EMOJI[r]} ${p.resources[r]}`));
      card.append(hand);
    } else {
      card.append(h('div', { class: 'hand muted' }, `🎴 ${resourceCount(p)} kart`));
    }
    list.append(card);
  });
  panel.append(list);

  panel.append(actionArea(state, a, view));

  const log = h('div', { class: 'log' });
  for (const line of state.log.slice(0, 8)) log.append(h('div', { class: 'log-line' }, line));
  panel.append(log);
  return panel;
}

function phaseHint(state: GameState): string {
  if (state.trade) {
    const f = state.players[state.trade.from].name;
    const t = state.players[state.trade.to].name;
    return `🤝 ${f} → ${t}: takas teklifi bekleniyor.`;
  }
  const cur = state.players[state.current]?.name ?? '';
  switch (state.phase) {
    case 'kurulum':
      return state.setupSubStage === 'koy' ? `${cur}: bir köy yeri seç (parlayan noktalar).` : `${cur}: köyüne bitişik bir yol seç.`;
    case 'zar': return `${cur}: zar atma sırası sende.`;
    case 'aksiyon': return `${cur}: inşa et, takas yap ya da turu bitir.`;
    case 'kervanci': return UI.kervanciTasi + '.';
    case 'bitti': return state.winner !== null ? `🎉 ${state.players[state.winner].name} kazandı!` : 'Oyun bitti.';
  }
}

function chips(map: Partial<Record<Resource, number>>): HTMLElement {
  const row = h('span', { class: 'tchips' });
  const keys = (Object.keys(map) as Resource[]).filter((r) => (map[r] ?? 0) > 0);
  if (keys.length === 0) return h('span', { class: 'tchips muted' }, '—');
  for (const r of keys) row.append(h('span', { class: 'tchip' }, `${RES_EMOJI[r]}×${map[r]}`));
  return row;
}

function tradeResponseCard(state: GameState, trade: TradeOffer, a: HudActions): HTMLElement {
  const canAccept = hasResources(state.players[trade.to], trade.want);
  return h('div', { class: 'trade-ask' },
    h('div', { class: 'ta-title' }, `${state.players[trade.from].name} sana takas öneriyor:`),
    h('div', { class: 'ta-line' }, h('span', { class: 'tlbl' }, 'Sana veriyor'), chips(trade.give)),
    h('div', { class: 'ta-line' }, h('span', { class: 'tlbl' }, 'Senden istiyor'), chips(trade.want)),
    canAccept ? '' : h('div', { class: 'ta-warn' }, 'İstenen kaynaklara sahip değilsin.'),
    h('div', { class: 'ta-btns' },
      h('button', { class: 'btn primary', disabled: !canAccept, onclick: () => a.onRespondTrade(true) }, 'Kabul Et'),
      h('button', { class: 'btn', onclick: () => a.onRespondTrade(false) }, 'Reddet'),
    ),
  );
}

function actionArea(state: GameState, a: HudActions, view: HudView): HTMLElement {
  const box = h('div', { class: 'actions' });

  if (state.phase === 'bitti') {
    box.append(h('button', { class: 'btn primary', onclick: a.onNewGame }, UI.yeniOyun));
    return box;
  }

  // Bekleyen takas teklifi öncelikli
  if (state.trade) {
    if (view.amResponder) {
      box.append(tradeResponseCard(state, state.trade, a));
    } else if (view.amProposer) {
      box.append(
        h('div', { class: 'waiting' }, '🤝 Teklif gönderildi, yanıt bekleniyor…'),
        h('button', { class: 'btn', onclick: a.onCancelTrade }, 'İptal'),
      );
    } else {
      box.append(h('div', { class: 'waiting' }, '🤝 Oyuncular takas görüşüyor…'));
    }
    return box;
  }

  if (!view.myTurn) {
    box.append(h('div', { class: 'waiting' }, `⏳ Sıra ${state.players[state.current].name}'de — bekle.`));
    return box;
  }

  if (state.phase === 'kurulum' || state.phase === 'kervanci') {
    box.append(h('button', { class: 'btn ghost', onclick: a.onNewGame }, UI.yeniOyun));
    return box;
  }

  if (state.phase === 'zar') {
    box.append(h('button', { class: 'btn primary big', onclick: a.onRoll }, UI.zarAt));
    return box;
  }

  // aksiyon fazı: inşaat + takas + turu bitir
  const player = state.players[state.current];
  const buildRow = h('div', { class: 'build-row' });
  (['yol', 'koy', 'sehir'] as const).forEach((m) => {
    const label = m === 'yol' ? UI.yol : m === 'koy' ? UI.koy : UI.sehir;
    const can = hasResources(player, COSTS[m]);
    buildRow.append(h('button', {
      class: `btn build${a.buildMode === m ? ' selected' : ''}`, disabled: !can,
      onclick: () => a.onBuild(a.buildMode === m ? null : m),
    }, h('span', { class: 'bl' }, label), h('span', { class: 'bc' }, costText(m))));
  });
  box.append(buildRow);

  box.append(renderTradePanel(state, { onBankTrade: a.onBankTrade, onProposeTrade: a.onProposeTrade }));
  box.append(h('button', { class: 'btn primary', onclick: a.onEndTurn }, UI.turuBitir));
  return box;
}
