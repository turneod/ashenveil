// Önyükleme: başlangıç ekranı (oyuncular, hedef puan, çocuk modu) ve oyunu başlatma.

import './style.css';
import { createGame } from './game/state';
import { GameController } from './ui/controller';
import { UI } from './i18n';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showStart(): void {
  app.replaceChildren();
  const card = document.createElement('div');
  card.className = 'start';
  card.innerHTML = `
    <h1>🌾 ${UI.baslik}</h1>
    <p class="tagline">Catan'dan ilhamlı, sade bir aile oyunu. Vadide köyler kurun,
       yollar döşeyin; ${'<b>10 puana</b>'} ilk ulaşan kazanır.</p>

    <label class="field">${UI.oyuncuSayisi}
      <select id="count">
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4" selected>4</option>
      </select>
    </label>

    <div id="names" class="names"></div>

    <label class="field">${UI.hedefPuan}
      <select id="target">
        <option value="8">8 (kısa oyun)</option>
        <option value="10" selected>10 (klasik)</option>
      </select>
    </label>

    <label class="check"><input type="checkbox" id="kid" /> ${UI.kidMode}</label>

    <button id="start" class="btn primary big">${UI.basla}</button>
  `;
  app.append(card);

  const count = card.querySelector<HTMLSelectElement>('#count')!;
  const names = card.querySelector<HTMLDivElement>('#names')!;
  const renderNames = () => {
    const n = Number(count.value);
    names.replaceChildren();
    for (let i = 0; i < n; i++) {
      const inp = document.createElement('input');
      inp.className = 'name-input';
      inp.value = `Oyuncu ${i + 1}`;
      inp.maxLength = 14;
      names.append(inp);
    }
  };
  count.addEventListener('change', renderNames);
  renderNames();

  card.querySelector<HTMLButtonElement>('#start')!.addEventListener('click', () => {
    const playerNames = [...names.querySelectorAll<HTMLInputElement>('.name-input')]
      .map((i, idx) => i.value.trim() || `Oyuncu ${idx + 1}`);
    const target = Number(card.querySelector<HTMLSelectElement>('#target')!.value);
    const kid = card.querySelector<HTMLInputElement>('#kid')!.checked;
    const state = createGame(playerNames, { targetScore: target, kidMode: kid });
    new GameController(app, state, showStart);
  });
}

showStart();
