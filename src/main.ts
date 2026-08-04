// Önyükleme ve ekran akışı: mod seçimi (yerel / oda kur / odaya katıl),
// ek paket seçimi, lobiler ve oyunun başlatılması. Görsel öğeler SVG ikon.

import './style.css';
import { createGame } from './game/state';
import type { PackConfig } from './game/types';
import { GameController } from './ui/controller';
import { LocalSession } from './session';
import type { Session } from './session';
import { HostRoom, GuestRoom } from './net/room';
import type { LobbyPlayer } from './net/protocol';
import { UI, PACK_AD, PACK_DESC } from './i18n';
import { uiIcon, resIcon } from './render/icons';

const app = document.querySelector<HTMLDivElement>('#app')!;

function el(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = String(v);
    else if (k === 'onclick') e.addEventListener('click', v as EventListener);
    else if (k === 'html') e.innerHTML = String(v);
    else if (k === 'disabled') { if (v) e.setAttribute('disabled', 'true'); }
    else e.setAttribute(k, String(v));
  }
  for (const kid of kids) e.append(kid);
  return e;
}

function card(...kids: Node[]): HTMLElement {
  const c = el('div', { class: 'start' }, ...kids);
  app.replaceChildren(c);
  return c;
}

function launchGame(session: Session): void {
  new GameController(app, session, () => { session.leave(); showStart(); });
}

function showStart(): void {
  card(
    el('h1', {}, resIcon('bugday', 24), ` ${UI.baslik}`),
    el('p', { class: 'tagline', html: "Catan'dan ilhamlı, sade bir aile oyunu. Vadide köyler kurun, yollar döşeyin; <b>ilk 10 puana</b> ulaşan kazanır." }),
    el('div', { class: 'mode-btns' },
      el('button', { class: 'btn primary big', onclick: showLocal }, uiIcon('cihaz', 20), ' Bu cihazda oyna (sırayla)'),
      el('button', { class: 'btn big', onclick: showHostSetup }, uiIcon('wifi', 20), ' Çevrimiçi oda kur'),
      el('button', { class: 'btn big', onclick: showJoinSetup }, uiIcon('link', 20), ' Bir odaya katıl'),
    ),
    el('p', { class: 'note', html: 'Çevrimiçi modda herkes kendi telefonundan katılır. <b>Oda kuran</b> kişi cihazını açık tutmalı.' }),
  );
}

function showLocal(): void {
  const c = card(el('h1', {}, uiIcon('cihaz', 22), ' Bu cihazda'), el('p', { class: 'tagline' }, 'Aynı cihazı sırayla kullanın.'));
  const count = el('select', { id: 'count' },
    el('option', { value: '2' }, '2'), el('option', { value: '3' }, '3'),
    el('option', { value: '4', selected: 'true' }, '4')) as HTMLSelectElement;
  const names = el('div', { class: 'names' });
  const renderNames = () => {
    names.replaceChildren();
    for (let i = 0; i < Number(count.value); i++) {
      names.append(el('input', { class: 'name-input', value: `Oyuncu ${i + 1}`, maxlength: '14' }));
    }
  };
  count.addEventListener('change', renderNames);
  renderNames();

  const o = setupOptions();
  c.append(field(UI.oyuncuSayisi, count), names, o.target, o.kid, o.packsEl,
    el('button', { class: 'btn primary big', onclick: () => {
      const playerNames = Array.from(names.querySelectorAll<HTMLInputElement>('.name-input'), (i, idx) => i.value.trim() || `Oyuncu ${idx + 1}`);
      const state = createGame(playerNames, { targetScore: o.getTarget(), kidMode: o.getKid(), packs: o.getPacks() });
      launchGame(new LocalSession(state));
    } }, UI.basla),
    backBtn(showStart));
}

function showHostSetup(): void {
  const c = card(el('h1', {}, uiIcon('wifi', 22), ' Oda kur'), el('p', { class: 'tagline' }, 'Sen kurucu olacaksın (1. oyuncu). Oda kodunu ailene ver.'));
  const name = el('input', { class: 'name-input', value: 'Oyuncu 1', maxlength: '14' }) as HTMLInputElement;
  const o = setupOptions();
  c.append(field('Adın', name), o.target, o.kid, o.packsEl,
    el('button', { class: 'btn primary big', onclick: () => {
      showHostLobby({ hostName: name.value.trim() || 'Oyuncu 1', targetScore: o.getTarget(), kidMode: o.getKid(), packs: o.getPacks() });
    } }, 'Odayı Aç'),
    backBtn(showStart));
}

function showHostLobby(opts: { hostName: string; targetScore: number; kidMode: boolean; packs: PackConfig }): void {
  const codeBox = el('div', { class: 'room-code' }, 'Oda açılıyor…');
  const listBox = el('div', { class: 'lobby-list' });
  const startBtn = el('button', { class: 'btn primary big', disabled: true }, 'Oyunu Başlat') as HTMLButtonElement;
  const statusBox = el('div', { class: 'note' }, 'Aracıya bağlanılıyor…');

  const room = new HostRoom(opts, {
    onReady: (code) => {
      codeBox.replaceChildren(el('span', { class: 'code-label' }, 'ODA KODU'), el('span', { class: 'code-value' }, code));
      statusBox.textContent = 'Hazır! Arkadaşların bu kodla katılabilir.';
    },
    onError: (msg) => { statusBox.textContent = 'Bağlantı hatası: ' + friendlyErr(msg); },
    onLobby: (players) => { renderLobby(listBox, players); startBtn.disabled = players.length < 2; },
    onStart: () => launchGame(room),
  });
  startBtn.addEventListener('click', () => room.start());
  card(el('h1', {}, uiIcon('wifi', 22), ' Oda'), codeBox, statusBox,
    el('h2', { class: 'sub' }, 'Katılanlar'), listBox, startBtn,
    backBtn(() => { room.leave(); showStart(); }));
}

function showJoinSetup(): void {
  const c = card(el('h1', {}, uiIcon('link', 22), ' Odaya katıl'), el('p', { class: 'tagline' }, 'Kurucudan aldığın oda kodunu gir.'));
  const code = el('input', { class: 'name-input code-input', placeholder: 'ABCD', maxlength: '4' }) as HTMLInputElement;
  code.addEventListener('input', () => { code.value = code.value.toUpperCase(); });
  const name = el('input', { class: 'name-input', value: 'Oyuncu 2', maxlength: '14' }) as HTMLInputElement;
  c.append(field('Oda kodu', code), field('Adın', name),
    el('button', { class: 'btn primary big', onclick: () => {
      const cd = code.value.trim().toUpperCase();
      if (cd.length < 4) { code.focus(); return; }
      showGuestLobby(cd, name.value.trim() || 'Oyuncu');
    } }, 'Katıl'),
    backBtn(showStart));
}

function showGuestLobby(code: string, name: string): void {
  const listBox = el('div', { class: 'lobby-list' });
  const statusBox = el('div', { class: 'note' }, `"${code}" odasına bağlanılıyor…`);
  const room = new GuestRoom(code, name, {
    onError: (msg) => { statusBox.textContent = 'Hata: ' + friendlyErr(msg); },
    onLobby: (players) => { renderLobby(listBox, players); statusBox.textContent = 'Bağlanıldı. Kurucunun başlatması bekleniyor…'; },
    onStart: () => launchGame(room),
    onClose: () => { statusBox.textContent = 'Bağlantı kapandı.'; },
  });
  card(el('h1', {}, uiIcon('link', 22), ' Oda: ' + code), statusBox,
    el('h2', { class: 'sub' }, 'Katılanlar'), listBox,
    backBtn(() => { room.leave(); showStart(); }));
}

// ---------- Ortak parçalar ----------

function renderLobby(box: HTMLElement, players: LobbyPlayer[]): void {
  box.replaceChildren();
  for (const p of players) {
    box.append(el('div', { class: 'lobby-player' },
      el('span', { class: `dot p${p.seat}` }),
      el('span', {}, p.name + (p.seat === 0 ? ' (kurucu)' : '')),
    ));
  }
}

function field(label: string, control: HTMLElement): HTMLElement {
  return el('label', { class: 'field' }, label, control);
}

function setupOptions(): {
  target: HTMLElement; kid: HTMLElement; packsEl: HTMLElement;
  getTarget: () => number; getKid: () => boolean; getPacks: () => PackConfig;
} {
  const target = el('select', { id: 'target' },
    el('option', { value: '8' }, '8 (kısa oyun)'),
    el('option', { value: '10', selected: 'true' }, '10 (klasik)')) as HTMLSelectElement;
  const kidChk = el('input', { type: 'checkbox', id: 'kid' }) as HTMLInputElement;
  const kidLabel = el('label', { class: 'check' }, kidChk, ` ${UI.kidMode}`);

  const checks: Record<'gorev' | 'olay' | 'liman', HTMLInputElement> = {
    gorev: el('input', { type: 'checkbox' }) as HTMLInputElement,
    olay: el('input', { type: 'checkbox' }) as HTMLInputElement,
    liman: el('input', { type: 'checkbox' }) as HTMLInputElement,
  };
  const iconOf: Record<string, string> = { gorev: 'gorev', olay: 'olay', liman: 'liman' };
  const packsEl = el('div', { class: 'packs' }, el('div', { class: 'sub' }, UI.paketler),
    el('div', { class: 'pack-info' }, uiIcon('kart', 15), ' Gelişim Kartları — oyuna dahil'));
  (['gorev', 'olay', 'liman'] as const).forEach((key) => {
    packsEl.append(el('label', { class: 'pack-row' }, checks[key],
      el('div', { class: 'pack-text' },
        el('div', { class: 'pack-name' }, uiIcon(iconOf[key], 15), ' ' + PACK_AD[key]),
        el('div', { class: 'pack-desc' }, PACK_DESC[key]))));
  });

  return {
    target: field(UI.hedefPuan, target),
    kid: kidLabel,
    packsEl,
    getTarget: () => Number(target.value),
    getKid: () => kidChk.checked,
    getPacks: () => ({ gorev: checks.gorev.checked, olay: checks.olay.checked, liman: checks.liman.checked }),
  };
}

function backBtn(fn: () => void): HTMLElement {
  return el('button', { class: 'btn ghost', onclick: fn }, '← Geri');
}

function friendlyErr(code: string): string {
  const map: Record<string, string> = {
    'oda-dolu': 'Oda dolu ya da oyun başlamış.',
    'peer-unavailable': 'Oda bulunamadı. Kodu kontrol et.',
    'baglanti-hatasi': 'Bağlantı kurulamadı.',
    'network': 'Ağ hatası. İnternet bağlantını kontrol et.',
    'server-error': 'Aracı sunucuya ulaşılamadı, tekrar dene.',
    'unavailable-id': 'Oda kodu çakıştı, tekrar dene.',
  };
  return map[code] ?? code;
}

showStart();
