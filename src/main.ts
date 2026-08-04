// Önyükleme ve ekran akışı: mod seçimi (yerel / oda kur / odaya katıl),
// lobiler ve oyunun başlatılması.

import './style.css';
import { createGame } from './game/state';
import { GameController } from './ui/controller';
import { LocalSession } from './session';
import type { Session } from './session';
import { HostRoom, GuestRoom } from './net/room';
import type { LobbyPlayer } from './net/protocol';
import { UI } from './i18n';

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

// ---------- Giriş ----------

function showStart(): void {
  card(
    el('h1', {}, `🌾 ${UI.baslik}`),
    el('p', { class: 'tagline', html: "Catan'dan ilhamlı, sade bir aile oyunu. Vadide köyler kurun, yollar döşeyin; <b>ilk 10 puana</b> ulaşan kazanır." }),
    el('div', { class: 'mode-btns' },
      el('button', { class: 'btn primary big', onclick: showLocal }, '📱 Bu cihazda oyna (sırayla)'),
      el('button', { class: 'btn big', onclick: showHostSetup }, '🛰️ Çevrimiçi oda kur'),
      el('button', { class: 'btn big', onclick: showJoinSetup }, '🔗 Bir odaya katıl'),
    ),
    el('p', { class: 'note', html: 'Çevrimiçi modda herkes kendi telefonundan katılır. <b>Oda kuran</b> kişi cihazını açık tutmalı; diğerleri oda koduyla bağlanır.' }),
  );
}

// ---------- Yerel (hot-seat) ----------

function showLocal(): void {
  const c = card();
  c.append(
    el('h1', {}, '📱 Bu cihazda'),
    el('p', { class: 'tagline' }, 'Aynı cihazı sırayla kullanarak oynayın.'),
  );
  const count = el('select', { id: 'count' },
    el('option', { value: '2' }, '2'), el('option', { value: '3' }, '3'),
    el('option', { value: '4', selected: 'true' }, '4')) as HTMLSelectElement;
  const names = el('div', { class: 'names' });
  const renderNames = () => {
    names.replaceChildren();
    for (let i = 0; i < Number(count.value); i++) {
      const inp = el('input', { class: 'name-input', value: `Oyuncu ${i + 1}`, maxlength: '14' });
      names.append(inp);
    }
  };
  count.addEventListener('change', renderNames);
  renderNames();

  const opts = optionRows();
  c.append(
    field(UI.oyuncuSayisi, count), names, opts.target, opts.kid,
    el('button', { class: 'btn primary big', onclick: () => {
      const playerNames = Array.from(names.querySelectorAll<HTMLInputElement>('.name-input'),
        (i, idx) => i.value.trim() || `Oyuncu ${idx + 1}`);
      const state = createGame(playerNames, { targetScore: opts.getTarget(), kidMode: opts.getKid() });
      launchGame(new LocalSession(state));
    } }, UI.basla),
    backBtn(showStart),
  );
}

// ---------- Oda kur (host) ----------

function showHostSetup(): void {
  const c = card();
  const name = el('input', { class: 'name-input', value: 'Oyuncu 1', maxlength: '14' }) as HTMLInputElement;
  const opts = optionRows();
  c.append(
    el('h1', {}, '🛰️ Oda kur'),
    el('p', { class: 'tagline' }, 'Sen kurucu olacaksın (1. oyuncu). Oda kodunu ailene ver.'),
    field('Adın', name), opts.target, opts.kid,
    el('button', { class: 'btn primary big', onclick: () => {
      showHostLobby({
        hostName: name.value.trim() || 'Oyuncu 1',
        targetScore: opts.getTarget(),
        kidMode: opts.getKid(),
      });
    } }, 'Odayı Aç'),
    backBtn(showStart),
  );
}

function showHostLobby(opts: { hostName: string; targetScore: number; kidMode: boolean }): void {
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
    onLobby: (players) => {
      renderLobby(listBox, players);
      startBtn.disabled = players.length < 2;
    },
    onStart: () => launchGame(room),
  });

  startBtn.addEventListener('click', () => room.start());
  const c = card(
    el('h1', {}, '🛰️ Oda'),
    codeBox, statusBox,
    el('h2', { class: 'sub' }, 'Katılanlar'), listBox,
    startBtn,
    backBtn(() => { room.leave(); showStart(); }),
  );
  void c;
}

// ---------- Odaya katıl (guest) ----------

function showJoinSetup(): void {
  const c = card();
  const code = el('input', { class: 'name-input code-input', placeholder: 'ABCD', maxlength: '4' }) as HTMLInputElement;
  code.addEventListener('input', () => { code.value = code.value.toUpperCase(); });
  const name = el('input', { class: 'name-input', value: 'Oyuncu 2', maxlength: '14' }) as HTMLInputElement;
  c.append(
    el('h1', {}, '🔗 Odaya katıl'),
    el('p', { class: 'tagline' }, 'Kurucudan aldığın oda kodunu gir.'),
    field('Oda kodu', code), field('Adın', name),
    el('button', { class: 'btn primary big', onclick: () => {
      const cd = code.value.trim().toUpperCase();
      if (cd.length < 4) { code.focus(); return; }
      showGuestLobby(cd, name.value.trim() || 'Oyuncu');
    } }, 'Katıl'),
    backBtn(showStart),
  );
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

  card(
    el('h1', {}, '🔗 Oda: ' + code),
    statusBox,
    el('h2', { class: 'sub' }, 'Katılanlar'), listBox,
    backBtn(() => { room.leave(); showStart(); }),
  );
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

function optionRows(): { target: HTMLElement; kid: HTMLElement; getTarget: () => number; getKid: () => boolean } {
  const target = el('select', { id: 'target' },
    el('option', { value: '8' }, '8 (kısa oyun)'),
    el('option', { value: '10', selected: 'true' }, '10 (klasik)')) as HTMLSelectElement;
  const kidChk = el('input', { type: 'checkbox', id: 'kid' }) as HTMLInputElement;
  const kidLabel = el('label', { class: 'check' }, kidChk, ` ${UI.kidMode}`);
  return {
    target: field(UI.hedefPuan, target),
    kid: kidLabel,
    getTarget: () => Number(target.value),
    getKid: () => kidChk.checked,
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
