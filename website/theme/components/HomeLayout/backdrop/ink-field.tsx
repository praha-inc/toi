import { useEffect, useRef } from 'react';

import { INK_FLOW_GLSL, inkFlowColor, inkFlowGain, inkFlowState } from './ink-flow';

import type { FC } from 'react';

/**
 * 墨流し (suminagashi) — ink floated on water. A slow, ever-drifting flow
 * field in ink and vermillion, with a soft ripple that follows the pointer.
 * Fixed behind the whole page (not scoped to the hero) so the effect reads
 * as one continuous atmosphere rather than cutting off once you scroll past it.
 * The field itself lives in `ink-flow.ts`, shared with `HomeMark`, which
 * dissolves the mark into this same flow.
 */

const VERTEX = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform vec3 uPaper;
  uniform float uInkStrength;
  uniform float uInkGain;

  varying vec2 vUv;

  ${INK_FLOW_GLSL}

  void main() {
    InkFlow flow = inkFlow(vUv, uResolution, uMouse, uTime);
    float f = flow.f;

    // Suminagashi proper: many soft concentric contours of the warped field
    // (the rings a drop of ink makes on water, dragged into eddies), over a
    // broad, faint pool of tone where the ink has settled. A single thin
    // ridge — the earlier approach — read as liquid chrome, not ink.
    float lines = inkContour(f, uTime);
    float pool = smoothstep(0.42, 0.72, f);

    // Vary the density across the sheet — denser here, near-clean paper
    // there — without ever masking the flow out entirely. Kept light
    // overall: it's a ground for the copy to sit on, not a competing image.
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * aspect * 1.8;
    float region = 0.3 + 0.7 * smoothstep(0.3, 0.7, fbm(p * 0.45 + vec2(2.3, -1.1) + 0.05 * uTime * 0.022));

    float ink = (lines * 0.13 + pool * 0.05) * region * uInkStrength * uInkGain;
    float accentMask = smoothstep(0.6, 0.0, flow.ripple) * 0.55;

    vec3 color = uPaper;
    color = mix(color, uInk, ink);
    color = mix(color, uAccent, accentMask * ink * 1.2);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const InkField: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const { Renderer, Program, Mesh, Triangle, Color } = await import('ogl');
      if (disposed) {
        return;
      }

      const renderer = new Renderer({ dpr: Math.min(globalThis.devicePixelRatio || 1, 2), alpha: false });
      const { gl } = renderer;
      if (!gl) {
        return;
      }

      container.append(gl.canvas);

      const readColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      // Ink is always dark ink — unlike --wa-sumi (which flips to a light
      // tone in dark mode for text contrast), the flow itself should stay a
      // subtle, moody presence rather than invert into bright smoke.
      // In light mode the ink is a warm grey rather than full sumi, so the
      // flow sits behind the text as a wash instead of competing with it.
      // Dark mode needs both a lighter ink and more of it: the same mix that
      // reads as a clear wash on cream paper all but vanishes against the
      // near-black ground, since the eye has far less contrast to work with.
      const isDark = () => document.documentElement.classList.contains('dark');

      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        // The shared array: smoothed in place below, and bound as-is by
        // `HomeMark`, so both shaders ripple around the same point.
        uMouse: { value: inkFlowState.mouse },
        uInk: { value: new Color(inkFlowColor(isDark())) },
        uAccent: { value: new Color(readColor('--wa-shu')) },
        uPaper: { value: new Color(readColor('--wa-kinari')) },
        uInkStrength: { value: 0 },
        uInkGain: { value: inkFlowGain(isDark()) },
      };

      const geometry = new Triangle(gl);
      const program = new Program(gl, { vertex: VERTEX, fragment: FRAGMENT, uniforms });
      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        const { clientWidth, clientHeight } = container;
        renderer.setSize(clientWidth, clientHeight);
        uniforms.uResolution.value = [clientWidth, clientHeight];
      };
      resize();
      globalThis.addEventListener('resize', resize);

      let targetMouse: [number, number] = [0.5, 0.35];
      const handlePointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        targetMouse = [
          (event.clientX - rect.left) / rect.width,
          1 - (event.clientY - rect.top) / rect.height,
        ];
      };
      globalThis.addEventListener('pointermove', handlePointerMove);

      const syncColors = () => {
        uniforms.uInk.value.set(inkFlowColor(isDark()));
        uniforms.uInkGain.value = inkFlowGain(isDark());
        uniforms.uAccent.value.set(readColor('--wa-shu'));
        uniforms.uPaper.value.set(readColor('--wa-kinari'));
      };
      const themeObserver = new MutationObserver(syncColors);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      let visible = true;
      const handleVisibilityChange = () => {
        visible = document.visibilityState === 'visible';
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const start = performance.now();
      let raf = 0;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (!visible) {
          return;
        }

        const elapsed = (now - start) / 1000;
        uniforms.uTime.value = elapsed;
        inkFlowState.time = elapsed;
        uniforms.uInkStrength.value = Math.min(elapsed / 2.5, 1);

        const mouse = uniforms.uMouse.value;
        mouse[0] += (targetMouse[0] - mouse[0]) * 0.04;
        mouse[1] += (targetMouse[1] - mouse[1]) * 0.04;

        renderer.render({ scene: mesh });
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        globalThis.removeEventListener('resize', resize);
        globalThis.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        themeObserver.disconnect();
        gl.canvas.remove();
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="home-ink" aria-hidden="true" />;
};
