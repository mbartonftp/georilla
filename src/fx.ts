/* Confetti: leaves and paper bits on a full-screen canvas. */
interface Bit { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; col: string; leaf: boolean; life: number }
const COLORS = ["#ffd23f", "#ff7849", "#4fe0b0", "#5ab4ff", "#b58cff", "#7ccf5a"];

export class Confetti {
  private x: CanvasRenderingContext2D;
  private bits: Bit[] = [];
  private running = false;

  constructor(private canvas: HTMLCanvasElement, private reduce: boolean) {
    this.x = canvas.getContext("2d")!;
    addEventListener("resize", () => this.size()); this.size();
  }

  private size(): void {
    const d = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = innerWidth * d; this.canvas.height = innerHeight * d; this.x.setTransform(d, 0, 0, d, 0, 0);
  }

  burst(ox: number, oy: number, n = 120, colors: string[] = COLORS): void {
    if (this.reduce) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
      this.bits.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: Math.random() * 6.3, vr: (Math.random() - .5) * .4,
        w: 6 + Math.random() * 8, h: 4 + Math.random() * 5, col: colors[i % colors.length], leaf: Math.random() < .35, life: 1 });
    }
    if (!this.running) { this.running = true; requestAnimationFrame(() => this.step()); }
  }

  private step(): void {
    const x = this.x;
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of this.bits) {
      p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .008;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); x.fillStyle = p.col;
      if (p.leaf) { x.beginPath(); x.ellipse(0, 0, p.w, p.h * .6, 0, 0, Math.PI * 2); x.fill(); }
      else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      x.restore();
    }
    this.bits = this.bits.filter(p => p.life > 0 && p.y < innerHeight + 40);
    if (this.bits.length) requestAnimationFrame(() => this.step());
    else { this.running = false; x.clearRect(0, 0, innerWidth, innerHeight); }
  }
}
