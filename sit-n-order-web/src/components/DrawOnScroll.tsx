"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Draws monoline SVG strokes when they scroll into view.
 *
 * Measures each `.stroke-draw` path's real length with getTotalLength() and
 * writes it to a `--len` custom property, so the dash animation is exact for
 * whatever geometry the child happens to contain. Hand-guessing dasharray
 * values leaves a visible jump at the end of the draw.
 *
 * Sets `data-drawn` once and does not unset it — an element that re-enters the
 * viewport should not redraw itself on every scroll pass.
 */
export function DrawOnScroll({
  children,
  className,
  threshold = 0.25,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.querySelectorAll<SVGGeometryElement>(".stroke-draw").forEach((path) => {
      if (typeof path.getTotalLength !== "function") return;
      const len = Math.ceil(path.getTotalLength());
      if (len > 0) path.style.setProperty("--len", String(len));
    });

    // Draw immediately for anyone who has asked for less motion, rather than
    // leaving the illustration permanently retracted and invisible.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      el.dataset.drawn = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.drawn = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} data-drawn="false" className={className}>
      {children}
    </div>
  );
}
