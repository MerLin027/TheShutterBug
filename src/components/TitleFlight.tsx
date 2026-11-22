"use client";

import { useEffect } from "react";

/**
 * Home: the big title flies into the navbar (owner, 2026-11-22: "while the
 * title is visible the title on the navbar should not be there… when I
 * scroll, the main title should flow to that position on the navbar").
 *
 * At the top of Home the navbar wordmark is hidden (SiteNav adds
 * `.wordmark-docked` on "/"; its opacity comes from `--dock`). As the page
 * scrolls through the first half-screen, a copy of the title travels from
 * the hero title's live position and size to the wordmark's, and at the end
 * crossfades into the real wordmark. Scrolling back reverses it.
 *
 * Why a copy: the real title is inside the hero, which clips and fades as it
 * scrolls (hero-print, hero-lift), so it can't leave it. The copy is fixed,
 * above the header, carries the title's own computed type, and is drawn at
 * the title's size and scaled DOWN (crisp; scaling small text up blurs).
 * The real title is only hidden while the copy is out, so its one-time
 * develop/safelight animation at the top is untouched.
 *
 * Positions are read live each frame (the hero title itself drifts with
 * hero-lift), from text Ranges, so both ends align on the letters, not on
 * line boxes of different heights.
 *
 * Reduced motion: no flight; the wordmark appears once the title has
 * scrolled away. A title that wraps (very narrow phones) skips the flight
 * the same way.
 */

const FLIGHT = 0.5; // of the viewport height: scroll distance for the whole flight
const HANDOFF = 0.88; // progress at which the copy starts fading into the wordmark

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function textRect(el: Element): DOMRect {
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect();
}
/** True when the title sits on one line: its first and last letters share
 *  a line. (Counting the Range's client rects doesn't work: the spaces
 *  between the letter spans get line-box rects at other heights.) */
function oneLine(el: Element): boolean {
  const chars = el.querySelectorAll(".char");
  if (chars.length < 2) return true;
  const a = chars[0].getBoundingClientRect();
  const b = chars[chars.length - 1].getBoundingClientRect();
  return Math.abs(a.top - b.top) < a.height / 2;
}

export default function TitleFlight() {
  useEffect(() => {
    const title = document.getElementById("hero-title");
    const letters = title?.querySelector(".hero-title-wrap");
    const mark = document.querySelector<HTMLElement>(".site-header .wordmark");
    if (!title || !letters || !mark) return;
    // The title's group (eyebrow + title). Its own opacity, because the
    // eyebrow's rise animation would override an inline style on it.
    const group = title.closest<HTMLElement>(".hero-top");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const copy = document.createElement("div");
    copy.setAttribute("aria-hidden", "true");
    copy.className = "title-flight";
    copy.textContent = (title.getAttribute("aria-label") ?? "The Shutter Bug").trim();
    document.body.appendChild(copy);

    // The copy's own text box at scale 1, measured whenever type can change.
    let natural = { w: 1, ox: 0, oy: 0 };
    const measure = () => {
      const cs = getComputedStyle(title);
      Object.assign(copy.style, {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        // The h1 holds the settled tracking; the letters wrapper animates
        // its own (focus-pull starts wide), so it would copy a mid-animation
        // value when measured early.
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        transform: "none",
      });
      const box = copy.getBoundingClientRect();
      const text = textRect(copy);
      natural = { w: text.width || 1, ox: text.left - box.left, oy: text.top - box.top };
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const p = clamp01(window.scrollY / (window.innerHeight * FLIGHT));
      const single = oneLine(letters);
      const flying = p > 0 && p < 1 && !reduced.matches && single;

      // The wordmark: hidden at the top, revealed at the end of the flight.
      const dock = reduced.matches || !single ? (p >= 1 ? 1 : 0) : clamp01((p - HANDOFF) / (1 - HANDOFF));
      mark.style.setProperty("--dock", String(dock));

      if (!flying) {
        copy.style.visibility = "hidden";
        title.style.opacity = "";
        if (group) group.style.opacity = p >= 1 && !reduced.matches && single ? "0" : "";
        return;
      }

      const a = textRect(letters);
      const b = textRect(mark);
      const e = ease(p);
      const s = (a.width + (b.width - a.width) * e) / natural.w;
      const x = a.left + (b.left - a.left) * e;
      const y = a.top + (b.top - a.top) * e;
      copy.style.transform = `translate(${x - natural.ox * s}px, ${y - natural.oy * s}px) scale(${s})`;
      copy.style.opacity = String(1 - clamp01((p - HANDOFF) / (1 - HANDOFF)));
      copy.style.visibility = "visible";
      title.style.opacity = "0";
      // The line above the title (eyebrow) clears out of the copy's path in
      // the first fifth of the flight; it used to linger under it on phones.
      if (group) group.style.opacity = String(1 - clamp01(p * 5));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      schedule();
    };

    measure();
    update();
    document.fonts?.ready.then(remeasure).catch(() => {});
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    reduced.addEventListener("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      reduced.removeEventListener("change", schedule);
      copy.remove();
      title.style.opacity = "";
      if (group) group.style.opacity = "";
      mark.style.removeProperty("--dock");
    };
  }, []);

  return null;
}
