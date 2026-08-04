// Masanın sol üstünde duran iki zar. Atıldığında kısa "yuvarlanma" animasyonu,
// sonra sonuca oturur. Kutu kapatılabilir (×); kapatınca küçük bir zar düğmesi kalır.

import { uiIcon } from '../render/icons';

const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

export class DiceBox {
  readonly el: HTMLDivElement;
  private inner: HTMLDivElement;
  private reopen: HTMLButtonElement;
  private d1: HTMLDivElement;
  private d2: HTMLDivElement;
  private timer: number | null = null;
  private collapsed = false;
  private lastDice: [number, number] | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'dice-box';
    this.el.style.display = 'none';

    this.inner = document.createElement('div');
    this.inner.className = 'dice-inner';
    this.d1 = makeDie();
    this.d2 = makeDie();
    const close = document.createElement('button');
    close.className = 'dice-close';
    close.textContent = '×';
    close.title = 'Zarı gizle';
    close.addEventListener('pointerdown', (e) => e.stopPropagation());
    close.addEventListener('click', (e) => { e.stopPropagation(); this.collapsed = true; this.stop(); this.layout(); });
    this.inner.append(this.d1, this.d2, close);

    this.reopen = document.createElement('button');
    this.reopen.className = 'dice-reopen';
    this.reopen.title = 'Zarı göster';
    this.reopen.append(uiIcon('zar', 22));
    this.reopen.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.reopen.addEventListener('click', (e) => { e.stopPropagation(); this.collapsed = false; this.layout(); });

    this.el.append(this.inner, this.reopen);
    this.layout();
  }

  update(dice: [number, number] | null, animate: boolean): void {
    this.lastDice = dice;
    if (!dice) { this.el.style.display = 'none'; this.stop(); return; }
    this.el.style.display = 'flex';
    this.layout();
    if (!this.collapsed) {
      if (animate) this.animateTo(dice);
      else this.setFaces(dice[0], dice[1]);
    }
  }

  private layout(): void {
    this.inner.style.display = this.collapsed ? 'none' : 'flex';
    this.reopen.style.display = this.collapsed ? 'flex' : 'none';
    if (!this.collapsed && this.lastDice) this.setFaces(this.lastDice[0], this.lastDice[1]);
  }

  private setFaces(a: number, b: number): void {
    renderDie(this.d1, a);
    renderDie(this.d2, b);
  }

  private animateTo(dice: [number, number]): void {
    this.stop();
    this.el.classList.add('rolling');
    let ticks = 0;
    this.timer = window.setInterval(() => {
      this.setFaces(1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6));
      if (++ticks >= 8) {
        this.stop();
        this.el.classList.remove('rolling');
        this.setFaces(dice[0], dice[1]);
        this.el.classList.add('landed');
        window.setTimeout(() => this.el.classList.remove('landed'), 320);
      }
    }, 70);
  }

  private stop(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }
}

function makeDie(): HTMLDivElement {
  const die = document.createElement('div');
  die.className = 'die3d';
  for (let i = 0; i < 9; i++) die.appendChild(document.createElement('span'));
  return die;
}

function renderDie(die: HTMLDivElement, value: number): void {
  const on = new Set(PIPS[value] ?? []);
  die.querySelectorAll('span').forEach((s, i) => { s.className = on.has(i) ? 'on' : ''; });
}
