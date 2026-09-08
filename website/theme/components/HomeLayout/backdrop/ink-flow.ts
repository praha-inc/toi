/**
 * The 墨流し (suminagashi) flow field, shared between everything that sits in
 * the ink: `InkField` paints it across the whole viewport, and `HomeMark`
 * dissolves the gate along the very same eddies so the strokes let go into
 * the ink that's actually behind them rather than into a look-alike.
 *
 * Both halves live here so they can't drift apart: the GLSL that evaluates
 * the field at a viewport position, and the live clock and pointer the
 * field is driven by — written by `InkField` each frame, read by anyone
 * else, so every shader sees the same instant of the same flow.
 */

/** Ink colour for the flow — see `InkField` for why it isn't `--wa-sumi`. */
export const inkFlowColor = (dark: boolean): string => (dark ? '#9a9184' : '#4a453d');

/** Extra ink in dark mode, where the same wash all but vanishes. */
export const inkFlowGain = (dark: boolean): number => (dark ? 1.7 : 1);

/**
 * Live state of the flow. `mouse` is the *smoothed* pointer position in
 * viewport uv (y up) — the same array `InkField` hands its shader, mutated
 * in place, so a second shader can bind it as a uniform and simply share it.
 */
export const inkFlowState = {
  time: 0,
  mouse: [0.5, 0.35] as [number, number],
};

/**
 * GLSL: `inkFlow(uv, resolution, mouse, time)` evaluates the field at a
 * viewport position `uv` (0..1, y up) for a viewport of `resolution` px.
 *   - `warp`    the eddy displacement the ink has been dragged through
 *   - `f`       the settled field the contour rings are drawn from
 *   - `ripple`  distance from the pointer's ripple, for the vermillion tint
 * `inkContour(f, time)` is the ring pattern `InkField` draws from `f`.
 */
export const INK_FLOW_GLSL = `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p *= 2.02;
      amp *= 0.55;
    }
    return value;
  }

  struct InkFlow {
    vec2 warp;
    float f;
    float ripple;
  };

  InkFlow inkFlow(vec2 uv, vec2 resolution, vec2 mouse, float time) {
    vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
    vec2 p = (uv - 0.5) * aspect * 1.8;

    float t = time * 0.022;

    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.12 * t),
      fbm(p + 3.0 * q + vec2(8.3, 2.8) + 0.1 * t)
    );

    vec2 mp = (mouse - 0.5) * aspect * 1.8;
    float d = length(p - mp);
    r += sin(d * 6.0 - time * 1.4) * exp(-d * 2.2) * 0.12;

    InkFlow flow;
    flow.warp = r;
    flow.f = fbm(p + 2.2 * r);
    flow.ripple = d;
    return flow;
  }

  float inkContour(float f, float time) {
    float contour = 0.5 + 0.5 * sin(f * 20.0 - time * 0.12);
    return smoothstep(0.5, 0.95, contour);
  }
`;
