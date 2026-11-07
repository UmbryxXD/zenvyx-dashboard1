/** Floating particle network that reacts to the mouse. Pure DOM, no dependencies. Returns a cleanup function. */
export function startParticles(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const g = ctx;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
  let w = 0, h = 0, raf = 0, mx = -9999, my = -9999;
  let pts: P[] = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(80, Math.floor((w * h) / 20000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.5 + 0.4, a: Math.random() * 0.5 + 0.35,
    }));
  }

  function frame() {
    g.clearRect(0, 0, w, h);
    for (const p of pts) {
      if (!reduce) {
        p.x += p.vx; p.y += p.vy;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 14000 && d2 > 1) { const f = 0.6 / Math.sqrt(d2); p.x += dx * f; p.y += dy * f; } // gentle push away
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fillStyle = `rgba(216,200,255,${p.a})`;
      g.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          g.strokeStyle = `rgba(167,139,250,${(1 - Math.sqrt(d2) / 130) * 0.3})`;
          g.lineWidth = 1;
          g.beginPath(); g.moveTo(pts[i].x, pts[i].y); g.lineTo(pts[j].x, pts[j].y); g.stroke();
        }
      }
      const dx = pts[i].x - mx, dy = pts[i].y - my, d2 = dx * dx + dy * dy;
      if (d2 < 190 * 190) { // lines to the cursor
        g.strokeStyle = `rgba(196,181,253,${(1 - Math.sqrt(d2) / 190) * 0.5})`;
        g.beginPath(); g.moveTo(pts[i].x, pts[i].y); g.lineTo(mx, my); g.stroke();
      }
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
  const onLeave = () => { mx = my = -9999; };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reduce) raf = requestAnimationFrame(frame);
  };

  resize();
  frame();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
