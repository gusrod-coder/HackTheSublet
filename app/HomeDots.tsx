"use client";
/**
 * Home background dots with a gentle parallax. Two depth layers drift up slower than the page scrolls;
 * dots are laid out in bands down a "world" tall enough for the whole page, so new dots keep sliding in
 * as you scroll instead of the background running out. Respects prefers-reduced-motion (dots stay put).
 */
import { useEffect, useRef, useState } from "react";
import s from "./page.module.css";

type Dot = { key: string; size: number; side: "left" | "right"; offset: number; top: number | string; color: string };
const COLORS = ["var(--peach)", "var(--butter)", "var(--sky)", "var(--blush)"];
const LAYERS = [
  { speed: 0.25, band: 640 }, // far: slow
  { speed: 0.5, band: 760 }, // near: a bit faster
];
const BAND_START = 900; // world y where generated bands begin (the first screen keeps the original two dots)

/** Deterministic pseudo-random in [0,1) so server/client and re-renders agree. */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function dotsFor(layer: number, worldHeight: number): Dot[] {
  const { band } = LAYERS[layer];
  // The original Figma dots: peach bottom-left (far layer), butter bottom-right (near layer).
  const first: Dot =
    layer === 0
      ? { key: "f0", size: 300, side: "left", offset: -170, top: "62vh", color: "var(--peach)" }
      : { key: "f1", size: 180, side: "right", offset: -80, top: "calc(94vh - 180px)", color: "var(--butter)" };
  const out: Dot[] = [first];
  for (let i = 0, y = BAND_START + layer * 260; y < worldHeight; i++, y += band) {
    const r = (k: number) => rnd(layer * 1000 + i * 10 + k);
    const size = layer === 0 ? 220 + Math.round(r(1) * 120) : 120 + Math.round(r(1) * 90);
    out.push({
      key: `${layer}-${i}`,
      size,
      side: (i + layer) % 2 === 0 ? "right" : "left",
      offset: -Math.round(size * (0.35 + r(2) * 0.3)), // mostly tucked off the edge, like the originals
      top: Math.round(y + r(3) * band * 0.4),
      color: COLORS[Math.floor(r(4) * COLORS.length)],
    });
  }
  return out;
}

export function HomeDots() {
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [heights, setHeights] = useState<number[]>([0, 0]);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const measure = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      // Each layer only travels speed × maxScroll, so it needs that much world below the first screen.
      setHeights(LAYERS.map((l) => Math.ceil(innerHeight + maxScroll * (reduce.matches ? 0 : l.speed)) + 200));
    };
    const apply = () => {
      frame = 0;
      const y = reduce.matches ? 0 : scrollY;
      LAYERS.forEach((l, i) => {
        const el = layerRefs.current[i];
        if (el) el.style.transform = `translate3d(0, ${-y * l.speed}px, 0)`;
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(apply); };
    const onResize = () => { measure(); onScroll(); };
    measure();
    apply();
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    reduce.addEventListener("change", onResize);
    return () => {
      ro.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      reduce.removeEventListener("change", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={s.dots} aria-hidden>
      {LAYERS.map((_, li) => (
        <div key={li} ref={(el) => { layerRefs.current[li] = el; }} className={s.dotLayer}>
          {dotsFor(li, heights[li]).map((d) => (
            <span key={d.key} className={s.dot}
              style={{ width: d.size, height: d.size, top: d.top, [d.side]: d.offset, background: d.color }} />
          ))}
        </div>
      ))}
    </div>
  );
}
