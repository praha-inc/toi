import { useI18n } from '@rspress/core/runtime';
import { useEffect, useRef } from 'react';

import { MARK_SEAL_PATH } from '../Mark';

import type I18nJson from 'i18n';
import type { FC } from 'react';

/**
 * The left margin of the sheet, fixed to the viewport: a vertical caption at
 * the top, a faint rule running the full height below it, and — drawn over
 * the rule as you read — a single brush stroke whose length is how far down
 * the page you are. When the brush reaches the foot of the page it lifts off
 * and the seal comes down after it, the way a 落款 (rakkan) closes a piece of
 * calligraphy: the page has been read, the question answered.
 *
 * The stroke is rebuilt as an outline each frame from a pressure profile —
 * a light landing, a swell, a tapered lift at the wet end — so the tip always
 * looks like a brush tip rather than a cut-off bar. Wobble and pressure are
 * keyed on absolute position, not on progress, so the stroke already laid
 * down doesn't shimmer as it grows.
 */

/** Width of the stroke's drawing area, in px; the brush wanders inside it. */
const TRACK_WIDTH = 12;
/** Widest the brush gets, in px. */
const BRUSH_WIDTH = 2.8;
/** How long the lifted tip tapers over, in px. */
const TIP_LENGTH = 26;
/** Distance between outline samples, in px. */
const SAMPLE_STEP = 5;
/** Progress at which the brush counts as having arrived and the seal comes down. */
const STAMP_AT = 0.985;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Cheap deterministic 1D noise in roughly [-1, 1]. */
const wobble = (y: number, seed: number): number => (
  Math.sin(y * 0.11 + seed) * 0.5
  + Math.sin(y * 0.053 + seed * 1.7 + 1.3) * 0.35
  + Math.sin(y * 0.23 + seed * 0.6) * 0.15
);

/** The stroke as a closed outline: down the left edge, back up the right. */
const strokePath = (length: number): string => {
  if (length < 1) return '';

  const centre = TRACK_WIDTH / 2;
  const count = Math.ceil(length / SAMPLE_STEP) + 1;
  const left: string[] = [];
  const right: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const y = Math.min(length, index * SAMPLE_STEP);
    // 起筆 — the brush lands a touch light, then bears down.
    const landing = Math.min(1, 0.45 + y / 12);
    // 収筆 — and lifts off to a point at the wet end.
    const lift = clamp01((length - y) / TIP_LENGTH) ** 0.7;
    const pressure = 0.82 + 0.18 * Math.sin(y * 0.007) + 0.22 * wobble(y, 4);
    const half = (BRUSH_WIDTH / 2) * landing * lift * pressure;
    const x = centre + wobble(y, 1) * 0.7;
    left.push(`${(x - half).toFixed(2)} ${y.toFixed(2)}`);
    right.push(`${(x + half).toFixed(2)} ${y.toFixed(2)}`);
  }

  return `M${left.join('L')}L${right.toReversed().join('L')}Z`;
};

export const Rail: FC = () => {
  const t = useI18n<typeof I18nJson>();
  const railRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const sealRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const track = trackRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const seal = sealRef.current;
    if (!rail || !track || !svg || !path || !seal) return;

    let height = 0;
    let target = 0;
    let current = 0;
    let frame = 0;

    const draw = () => {
      path.setAttribute('d', strokePath(current * height));
      seal.classList.toggle('home-rail__seal--stamped', current >= STAMP_AT);
    };

    // Ease towards the scroll position so the brush glides rather than jumps.
    const tick = () => {
      frame = 0;
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.0008) {
        current = target;
      } else {
        frame = requestAnimationFrame(tick);
      }
      draw();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const readScroll = () => {
      const range = document.documentElement.scrollHeight - globalThis.innerHeight;
      target = range > 0 ? clamp01(globalThis.scrollY / range) : 0;
      // The scroll cue clears out of the brush's way the moment reading starts.
      rail.classList.toggle('home-rail--scrolled', target > 0.01);
      schedule();
    };

    const measure = () => {
      height = track.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${TRACK_WIDTH} ${Math.max(1, height)}`);
      readScroll();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    measure();
    globalThis.addEventListener('scroll', readScroll, { passive: true });

    return () => {
      observer.disconnect();
      globalThis.removeEventListener('scroll', readScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <aside ref={railRef} className="home-rail" aria-hidden="true">
      <span className="home-rail__text">{t('home.hero.side')}</span>
      <div ref={trackRef} className="home-rail__track">
        <svg ref={svgRef} className="home-rail__stroke" viewBox={`0 0 ${TRACK_WIDTH} 1`} preserveAspectRatio="none" focusable="false">
          <defs>
            {/* Roughens the edges so the stroke bleeds into the paper like real ink instead of reading as a vector shape. */}
            <filter id="home-rail-ink" x="-100%" y="-2%" width="300%" height="104%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.7 0.05" numOctaves="2" seed="3" result="grain" />
              <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <path ref={pathRef} className="home-rail__ink" filter="url(#home-rail-ink)" />
        </svg>
      </div>
      {/* The foot of the rail: the scroll cue while the page is unread, the seal once it's been read through. */}
      <div className="home-rail__foot">
        <div className="home-rail__cue">
          <span className="home-rail__cue-text">Scroll</span>
          <span className="home-rail__cue-line" />
        </div>
        <svg ref={sealRef} className="home-rail__seal" viewBox="36 52 28 30" focusable="false">
          <path d={MARK_SEAL_PATH} />
        </svg>
      </div>
    </aside>
  );
};
