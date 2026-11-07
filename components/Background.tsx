"use client";

import { useEffect, useRef } from "react";
import { startParticles } from "@/lib/particles";

/** Fixed full-screen backdrop: aurora, grid, particle network, grain, cursor glow. Also powers the card spotlight. */
export function Background() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stop = canvas.current ? startParticles(canvas.current) : () => {};
    const root = document.documentElement;
    let raf = 0;
    let last: PointerEvent | null = null;

    const apply = () => {
      raf = 0;
      if (!last) return;
      root.style.setProperty("--cx", `${last.clientX}px`);
      root.style.setProperty("--cy", `${last.clientY}px`);
      const el = (last.target as HTMLElement | null)?.closest?.(".spot") as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${last.clientX - r.left}px`);
        el.style.setProperty("--my", `${last.clientY - r.top}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="fx aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="fx gridfx" aria-hidden="true" />
      <canvas ref={canvas} className="fx" aria-hidden="true" />
      <div className="fx cursor-glow" aria-hidden="true" />
      <div className="fx vignette" aria-hidden="true" />
      <div className="fx grain" aria-hidden="true" />
    </>
  );
}
