// Tahta için yakınlaştırma/kaydırma kabı (özellikle telefon için).
// Pinch-zoom (iki parmak), tek parmakla sürükleme, tekerlek/çift tık ile zoom
// ve +/−/sığdır butonları. Zoom durumu, oyun her yeniden çizildiğinde korunur.

export class BoardViewport {
  readonly el: HTMLDivElement;
  private inner: HTMLDivElement;
  private scale = 1;
  private tx = 0;
  private ty = 0;
  private fitScale = 1;
  private maxScale = 4;
  private cw = 1;
  private ch = 1;
  private ready = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private panLast: { x: number; y: number } | null = null;
  private pinchDist = 0;
  private moved = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'board-wrap';
    this.inner = document.createElement('div');
    this.inner.className = 'board-viewport';
    this.el.appendChild(this.inner);
    this.addControls();
    this.bind();
  }

  /** Yeni SVG tahtayı yerleştirir; ilk seferde ekrana sığdırır, sonra zoom'u korur. */
  setContent(svg: SVGSVGElement): void {
    const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
    this.cw = vb[2] || 1;
    this.ch = vb[3] || 1;
    svg.style.width = `${this.cw}px`;
    svg.style.height = `${this.ch}px`;
    svg.style.maxWidth = 'none';
    svg.style.maxHeight = 'none';
    this.inner.replaceChildren(svg);
    if (!this.ready) { this.ready = true; this.fit(); } else { this.apply(); }
  }

  fit(): void {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) { this.scale = 1; this.tx = 0; this.ty = 0; this.apply(); return; }
    this.fitScale = Math.min(r.width / this.cw, r.height / this.ch) * 0.98;
    this.scale = this.fitScale;
    this.tx = (r.width - this.cw * this.scale) / 2;
    this.ty = (r.height - this.ch * this.scale) / 2;
    this.apply();
  }

  private addControls(): void {
    const box = document.createElement('div');
    box.className = 'zoom-ctrl';
    const mk = (label: string, title: string, fn: () => void) => {
      const b = document.createElement('button');
      b.className = 'zbtn';
      b.textContent = label;
      b.title = title;
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
      return b;
    };
    box.append(
      mk('+', 'Yakınlaştır', () => this.zoomCenter(1.3)),
      mk('−', 'Uzaklaştır', () => this.zoomCenter(1 / 1.3)),
      mk('⤢', 'Tümünü sığdır', () => this.fit()),
    );
    this.el.appendChild(box);
  }

  private apply(): void {
    this.inner.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
  }

  private clampScale(s: number): number {
    return Math.max(this.fitScale * 0.9, Math.min(this.maxScale, s));
  }

  private zoomAt(px: number, py: number, factor: number): void {
    const ns = this.clampScale(this.scale * factor);
    const k = ns / this.scale;
    this.tx = px - k * (px - this.tx);
    this.ty = py - k * (py - this.ty);
    this.scale = ns;
    this.apply();
  }

  private zoomCenter(factor: number): void {
    const r = this.el.getBoundingClientRect();
    this.zoomAt(r.width / 2, r.height / 2, factor);
  }

  private dist(): number {
    const p = [...this.pointers.values()];
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }

  private mid(): { x: number; y: number } {
    const p = [...this.pointers.values()];
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
  }

  private bind(): void {
    this.el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = this.el.getBoundingClientRect();
      this.zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });

    this.el.addEventListener('pointerdown', (e) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.moved = false;
      if (this.pointers.size === 1) this.panLast = { x: e.clientX, y: e.clientY };
      else if (this.pointers.size === 2) this.pinchDist = this.dist();
    });

    this.el.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size >= 2) {
        e.preventDefault();
        const d = this.dist();
        if (this.pinchDist > 0) {
          const m = this.mid();
          const r = this.el.getBoundingClientRect();
          this.zoomAt(m.x - r.left, m.y - r.top, d / this.pinchDist);
        }
        this.pinchDist = d;
        this.moved = true;
      } else if (this.panLast) {
        const dx = e.clientX - this.panLast.x;
        const dy = e.clientY - this.panLast.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) this.moved = true;
        this.tx += dx;
        this.ty += dy;
        this.panLast = { x: e.clientX, y: e.clientY };
        this.apply();
      }
    });

    const end = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchDist = 0;
      if (this.pointers.size === 1) {
        const p = [...this.pointers.values()][0];
        this.panLast = { x: p.x, y: p.y };
      } else if (this.pointers.size === 0) {
        this.panLast = null;
        if (this.moved) this.suppressNextClick(); // kaydırmadan sonra kazara yerleştirmeyi önle
      }
    };
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', end);
    this.el.addEventListener('pointerleave', end);

    this.el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const r = this.el.getBoundingClientRect();
      this.zoomAt(e.clientX - r.left, e.clientY - r.top, 1.6);
    });
  }

  private suppressNextClick(): void {
    const blocker = (ev: Event) => {
      ev.stopPropagation();
      ev.preventDefault();
      this.el.removeEventListener('click', blocker, true);
    };
    this.el.addEventListener('click', blocker, true);
    setTimeout(() => this.el.removeEventListener('click', blocker, true), 350);
  }
}
