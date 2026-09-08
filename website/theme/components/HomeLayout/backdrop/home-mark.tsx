import { useEffect, useRef } from 'react';

import { INK_FLOW_GLSL, inkFlowColor, inkFlowState } from './ink-flow';
import { drawSealOutline, drawStrokeOutline, Mark, MARK_ANSWER_PARTS, MARK_ANSWER_PATH, MARK_GATE_PARTS, MARK_GATE_PATH } from '../../Mark';

import type { FC } from 'react';

/**
 * The toi mark as a backdrop, rendered as a real WebGL object (via `ogl`,
 * the same renderer `InkField` uses) instead of a CSS `rotateY` trick: a
 * pair of stacked outline planes — the mark's line art plus a faint
 * vermillion "ghost" offset behind it, echoing the slight colour
 * misregistration of a real woodblock print — spinning together in a
 * genuine perspective camera.
 *
 * Scrolling answers the question. The seal (口) holds still while the gate
 * (門) around it lets go into the 墨流し that is actually behind it: each
 * fragment looks up the shared flow field (`ink-flow.ts`) at its own screen
 * position, so the strokes give way from the clean paper first and hold
 * longest in the ink's pools, take on the ink's own contour rings, drift
 * along the same eddies and shade into the same ink colour — until nothing
 * tells them apart from the flow. Out of that same ink the strokes of 答
 * gather around the seal, which is now the 口 of 合. 問 → 答, with the
 * vermillion the one thing that never moves.
 * It happens a piece at a time (see `MARK_GATE_PARTS` / `MARK_ANSWER_PARTS`),
 * the two glyphs interleaved — a frame of the gate lets go, a 竹 gathers in
 * its place, and so on down to the posts and the bar — so the seal is never
 * left standing alone, and the answer only settles into clean line at the
 * foot of the page.
 * Also reacts to the pointer (a subtle yaw/pitch offset, like tilting a card
 * in your hand), with a soft brightness shimmer as it catches the light.
 */

const VERTEX = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;

  // One piece of the glyph per channel — see MARK_GATE_PARTS / MARK_ANSWER_PARTS.
  uniform sampler2D tGate;
  uniform sampler2D tAnswer;
  uniform sampler2D tSeal;
  uniform vec3 uColor;
  uniform float uOpacity;
  // 0 = 問 (the gate whole), 1 = 答 (the answer fully surfaced).
  uniform float uProgress;

  // Everything the ink field is driven by, so this shader sees the very
  // same flow at the very same instant — plus where this canvas sits in the
  // viewport, to look the flow up at each fragment's true screen position.
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uViewport;
  uniform vec2 uResolution;
  uniform vec2 uStageMin;
  uniform vec2 uStageSize;
  uniform vec3 uFlowInk;

  varying vec2 vUv;

  ${INK_FLOW_GLSL}

  // How far along a piece this fragment sits, 0 at the end that goes (or
  // gathers) first and 1 at the end that goes last — measured along the
  // line from one end to the other, in the mark's own uv.
  float along(vec2 uv, vec2 from, vec2 to) {
    vec2 run = to - from;
    return clamp(dot(uv - from, run) / dot(run, run), 0.0, 1.0);
  }

  void main() {
    vec2 screenUv = uStageMin + (gl_FragCoord.xy / uResolution) * uStageSize;
    InkFlow flow = inkFlow(screenUv, uViewport, uMouse, uTime);
    float f = flow.f;
    // What the ink behind this fragment actually looks like: its rings and
    // its settled pool — the same two terms InkField paints from.
    float rings = inkContour(f, uTime);
    float pool = smoothstep(0.42, 0.72, f);
    float inkHere = clamp(rings + pool * 0.5, 0.0, 1.0);

    // The handover runs down the page (0 = top, 1 = foot) with every piece
    // in motion at once: the whole gate lets go over most of the page while
    // the whole answer gathers (as ink, in the shape of its strokes) a little
    // behind it — so at no point is the seal left standing alone — and the
    // gathered ink settles into clean line last, the bar's exactly at the foot.
    //
    // No piece goes all at once: each has a direction, and lets go (or
    // gathers) gradually from one end to the other — the left frame from its
    // free end in towards the post, the left post from its foot up, the
    // right frame from its free end in, the right post from its top down;
    // the left 竹 from the tip of its leaf, the right 竹 from the far end of
    // its bar back to the tip, the roof from the left eave across, the bar
    // from the right. Ends are given in the mark's uv (y up).
    //
    // Nor do the pieces move in lockstep: each is offset a little on the
    // shared timeline, so their fronts are at different points along their
    // strokes at any moment. A point's turn is its piece's offset plus its
    // position along the piece; a single front per glyph moves through at
    // constant speed, and once it has passed a point that point takes TAIL
    // more to actually go — so nothing pauses, and nothing snaps.
    const float TAIL = 1.0;
    const vec4 GATE_OFFSET = vec4(0.0, 0.25, 0.1, 0.35);
    const vec4 ANSWER_OFFSET = vec4(0.0, 0.2, 0.3, 0.45);
    vec4 gateAlong = vec4(
      along(vUv, vec2(0.455, 0.74), vec2(0.105, 0.74)),
      along(vUv, vec2(0.14, 0.085), vec2(0.14, 0.915)),
      along(vUv, vec2(0.545, 0.74), vec2(0.895, 0.74)),
      along(vUv, vec2(0.86, 0.915), vec2(0.86, 0.085))
    );
    vec4 answerAlong = vec4(
      along(vUv, vec2(0.23, 0.93), vec2(0.44, 0.70)),
      along(vUv, vec2(0.82, 0.80), vec2(0.61, 0.93)),
      along(vUv, vec2(0.14, 0.53), vec2(0.86, 0.53)),
      along(vUv, vec2(0.64, 0.545), vec2(0.36, 0.545))
    );
    // The gate's front has run its course (the largest offset, the length of
    // a piece, and TAIL) by 95% of the page; the answer's starts 6% in and,
    // with the firming that trails it, is done exactly at the foot.
    float gateFront = uProgress / 0.95 * (0.35 + 1.0 + TAIL);
    float answerFront = (uProgress - 0.06) / 0.94 * (0.45 + 1.0 + TAIL * 0.5 + 1.5);
    vec4 dissolve = clamp((gateFront - (GATE_OFFSET + gateAlong)) / TAIL, 0.0, 1.0);
    vec4 emerge = clamp((answerFront - (ANSWER_OFFSET + answerAlong)) / TAIL, 0.0, 1.0);
    // A piece firms once it has gathered: from the moment its far end has
    // been reached, over a stretch of 1.5, so the ink settles into line while
    // the last of it is still pooling.
    vec4 firm = clamp((answerFront - (ANSWER_OFFSET + 1.0 + TAIL * 0.5)) / 1.5, 0.0, 1.0);
    // A point's own breaking (or gathering, or firming) is eased, so it
    // lingers half-way rather than snapping — the front itself never stops.
    dissolve = dissolve * dissolve * (3.0 - 2.0 * dissolve);
    emerge = emerge * emerge * (3.0 - 2.0 * emerge);
    firm = firm * firm * (3.0 - 2.0 * firm);

    // The eddy displacement the ink has been dragged through, as a drift
    // across the mark: what's left of a stroke travels with the flow.
    vec2 drift = (flow.warp - 0.5) * 0.14;

    // Letting go: the threshold climbs through the field, so the stroke
    // gives way over clean paper first and holds longest where the ink
    // pools — softly, so a stroke thins for a while before it breaks — and
    // what still holds takes on the ink's own ring pattern, so by the end
    // the remnants are indistinguishable from the flow.
    vec4 gateEdge = mix(vec4(-0.15), vec4(0.85), dissolve);
    vec4 hold = smoothstep(gateEdge - 0.22, gateEdge + 0.08, vec4(f));
    vec4 gateMask = vec4(
      texture2D(tGate, vUv + drift * dissolve.x).r,
      texture2D(tGate, vUv + drift * dissolve.y).g,
      texture2D(tGate, vUv + drift * dissolve.z).b,
      texture2D(tGate, vUv + drift * dissolve.w).a
    );
    vec4 gate = gateMask * hold * mix(vec4(1.0), vec4(inkHere), dissolve * 0.85);

    // Gathering: the same, run backwards — the answer first shows as ink
    // pooling in the shape of its strokes (never fainter than a wash, even
    // over clean paper), still wavering with the flow; then, as it firms, it
    // straightens, sheds the ring pattern and settles into line.
    vec4 answerEdge = mix(vec4(0.85), vec4(-0.15), emerge);
    vec4 gather = smoothstep(answerEdge - 0.22, answerEdge + 0.08, vec4(f));
    vec4 answerMask = vec4(
      texture2D(tAnswer, vUv - drift * (1.0 - firm.x)).r,
      texture2D(tAnswer, vUv - drift * (1.0 - firm.y)).g,
      texture2D(tAnswer, vUv - drift * (1.0 - firm.z)).b,
      texture2D(tAnswer, vUv - drift * (1.0 - firm.w)).a
    );
    vec4 answer = answerMask * gather * mix(vec4(max(inkHere, 0.45)), vec4(1.0), firm);

    float seal = texture2D(tSeal, vUv).a;

    // Each piece in its own colour: the seal always in the mark's colour, a
    // gate piece shading into the flow's ink as it goes, an answer piece
    // shading out of it as it firms — summed by coverage.
    vec3 gateInk = uColor * dot(gate, 1.0 - dissolve) + uFlowInk * dot(gate, dissolve);
    vec3 answerInk = uFlowInk * dot(answer, 1.0 - firm) + uColor * dot(answer, firm);
    float total = seal + dot(gate, vec4(1.0)) + dot(answer, vec4(1.0));
    vec3 color = (uColor * seal + gateInk + answerInk) / max(total, 0.001);

    // Premultiplied, to match the canvas (see the Renderer options).
    float alpha = min(total, 1.0) * uOpacity;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

const readColor = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const MASK_SIZE = 1024;
const MASK_LINE = 0.9;

const buildMaskCanvas = (draw: (context: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = MASK_SIZE;
  canvas.height = MASK_SIZE;

  const context = canvas.getContext('2d');
  if (context) {
    draw(context);
  }

  return canvas;
};

/**
 * Packs the outlines of up to four pieces of a glyph into one RGBA image, a
 * piece per channel, each hollowed with the whole glyph so that summed back
 * together they are exactly the whole glyph's outline (see `drawStrokeOutline`).
 */
const packPieceMasks = (pieces: readonly string[], whole: string): Uint8Array => {
  const data = new Uint8Array(MASK_SIZE * MASK_SIZE * 4);

  pieces.forEach((piece, channel) => {
    const canvas = buildMaskCanvas((context) => drawStrokeOutline(context, MASK_SIZE, piece, MASK_LINE, whole));
    const pixels = canvas.getContext('2d')?.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;
    if (!pixels) {
      return;
    }
    for (let index = 0; index < MASK_SIZE * MASK_SIZE; index++) {
      data[index * 4 + channel] = pixels[index * 4 + 3]!;
    }
  });

  return data;
};

export const HomeMark: FC = () => {
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
      const { Renderer, Camera, Transform, Program, Mesh, Plane, Texture, Color } = await import('ogl');
      if (disposed) {
        return;
      }

      // A premultiplied canvas, with the shader writing premultiplied colour
      // and the programs blending ONE / ONE_MINUS_SRC_ALPHA: the one setup in
      // which a thin wash of colour over a transparent canvas comes out the
      // colour it was drawn. Straight alpha here had the canvas holding
      // colour × alpha as if it were plain colour, so the page composited a
      // dark, muddied version of it — vermillion at 40% read as dusty mauve.
      const renderer = new Renderer({ dpr: Math.min(globalThis.devicePixelRatio || 1, 2), alpha: true, premultipliedAlpha: true });
      const { gl } = renderer;
      if (!gl) {
        return;
      }
      gl.clearColor(0, 0, 0, 0);

      container.append(gl.canvas);

      const camera = new Camera(gl, { fov: 32, near: 0.1, far: 20 });
      camera.position.set(0, 0, 6.4);

      const scene = new Transform();
      const markGroup = new Transform();
      markGroup.setParent(scene);

      // No mipmaps: these are thin stroke masks, and mipmapping washes their
      // alpha out to near-nothing the moment the plane rotates off face-on
      // (the GPU jumps to a blurrier LOD as soon as any axis foreshortens),
      // which read as the mark vanishing right after its first frame.
      const textureOptions = { generateMipmaps: false, minFilter: gl.LINEAR, premultiplyAlpha: false };
      const buildPieceTexture = (pieces: readonly string[], whole: string) =>
        new Texture(gl, { ...textureOptions, image: packPieceMasks(pieces, whole), width: MASK_SIZE, height: MASK_SIZE });
      const gateTexture = buildPieceTexture(MARK_GATE_PARTS, MARK_GATE_PATH);
      const answerTexture = buildPieceTexture(MARK_ANSWER_PARTS, MARK_ANSWER_PATH);
      const sealTexture = new Texture(gl, {
        ...textureOptions,
        image: buildMaskCanvas((context) => drawSealOutline(context, MASK_SIZE, MASK_LINE)),
      });
      const geometry = new Plane(gl, { width: 3.4, height: 3.4 });

      // Per-theme opacities. On cream paper a faint vermillion ghost behind
      // the ink outline reads as woodblock misregistration; on near-black
      // paper the same values sink into the ground and only one glyph
      // survives, so dark mode lifts both — the ghost most of all, and in the
      // lighter vermillion so it isn't lost against the dark.
      // A thin wash of vermillion over cream converges on the paper and goes
      // dusty rose, so light mode uses the brighter, more saturated shu made
      // for exactly that — the tint keeps its hue at low opacity.
      const isDark = () => document.documentElement.classList.contains('dark');
      const accentVariable = () => (isDark() ? '--wa-shu-light' : '--wa-shu-vivid');
      // `fadeFloor` is how much of the mark survives once you've scrolled
      // into the features. The answer surfaces out of the ink quieter than
      // the question was, so it sits behind the copy rather than across it —
      // but it has to stay legible as 答, and what registers on cream paper
      // is lost on near-black, so dark mode keeps a larger share.
      let mainBase = 0.24;
      let ghostBase = 0.3;
      let fadeFloor = 0.5;
      const syncOpacities = () => {
        mainBase = isDark() ? 0.46 : 0.24;
        ghostBase = isDark() ? 0.55 : 0.3;
        fadeFloor = isDark() ? 0.62 : 0.5;
      };
      syncOpacities();

      const uInk = { value: new Color(readColor('--wa-sumi')) };
      const uAccent = { value: new Color(readColor(accentVariable())) };

      // Shared between the ink and ghost planes, so both come apart and
      // re-form along the very same eddies.
      const uProgress = { value: 0 };
      const uTime = { value: inkFlowState.time };
      const uViewport = { value: [1, 1] };
      const uResolution = { value: [1, 1] };
      const uStageMin = { value: [0, 0] };
      const uStageSize = { value: [1, 1] };
      const uFlowInk = { value: new Color(inkFlowColor(isDark())) };
      const flowUniforms = {
        tGate: { value: gateTexture },
        tSeal: { value: sealTexture },
        tAnswer: { value: answerTexture },
        uProgress,
        uTime,
        // The ink field's own smoothed pointer, by reference.
        uMouse: { value: inkFlowState.mouse },
        uViewport,
        uResolution,
        uStageMin,
        uStageSize,
        uFlowInk,
      };

      const uGhostOpacity = { value: ghostBase };
      const ghostProgram = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        transparent: true,
        cullFace: false,
        depthWrite: false,
        uniforms: { ...flowUniforms, uColor: uAccent, uOpacity: uGhostOpacity },
      });
      // Premultiplied "over" — see the Renderer options. (ogl's default
      // transparent blend func reuses SRC_ALPHA for the alpha channel, which
      // squares a fractional opacity instead of accumulating it.)
      ghostProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const ghostMesh = new Mesh(gl, { geometry, program: ghostProgram });
      ghostMesh.position.set(0.12, -0.09, -0.4);
      ghostMesh.setParent(markGroup);

      const uMainOpacity = { value: mainBase };
      const mainProgram = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        transparent: true,
        cullFace: false,
        depthWrite: false,
        uniforms: { ...flowUniforms, uColor: uInk, uOpacity: uMainOpacity },
      });
      mainProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const mainMesh = new Mesh(gl, { geometry, program: mainProgram });
      mainMesh.setParent(markGroup);

      const resize = () => {
        const { clientWidth, clientHeight } = container;
        renderer.setSize(clientWidth, clientHeight);
        camera.perspective({ aspect: clientWidth / clientHeight });

        // Where this canvas sits in the viewport, in the ink field's own uv
        // (0..1 across the layout viewport, y up) — the stage is fixed, so
        // this only ever changes with the viewport. The ink field's canvas
        // fills the layout viewport, hence `clientWidth` rather than
        // `innerWidth`, which would count a classic scrollbar.
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const rect = container.getBoundingClientRect();
        uViewport.value = [viewportWidth, viewportHeight];
        uResolution.value = [gl.canvas.width, gl.canvas.height];
        uStageMin.value = [rect.left / viewportWidth, 1 - rect.bottom / viewportHeight];
        uStageSize.value = [rect.width / viewportWidth, rect.height / viewportHeight];
      };
      resize();
      globalThis.addEventListener('resize', resize);

      // Two paces. The question becomes the answer over the whole page —
      // the same measure the rail's brush stroke follows — so 答 is only
      // complete once you've read to the foot of the page. The tilt and the
      // fade take just under a screen, so by the time the features arrive the
      // mark has settled quieter behind them; then, as the answer completes,
      // it comes part of the way back up so 答 is read whole.
      let targetProgress = 0;
      let targetTilt = 0;
      let targetFade = 1;
      const smoothstep = (edge0: number, edge1: number, value: number) => {
        const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
        return t * t * (3 - 2 * t);
      };
      const handleScroll = () => {
        const range = document.documentElement.scrollHeight - globalThis.innerHeight;
        const answer = range > 0 ? Math.min(Math.max(globalThis.scrollY / range, 0), 1) : 0;
        const settle = Math.min(globalThis.scrollY / (globalThis.innerHeight * 0.9), 1);
        const settled = 1 - settle * (1 - fadeFloor);
        targetProgress = answer;
        targetTilt = settle * 0.22;
        targetFade = settled + (0.85 - settled) * smoothstep(0.75, 1, answer);
      };
      handleScroll();
      globalThis.addEventListener('scroll', handleScroll, { passive: true });

      let targetYaw = 0;
      let targetPitch = 0;
      const handlePointerMove = (event: PointerEvent) => {
        targetYaw = ((event.clientX / globalThis.innerWidth) * 2 - 1) * 0.18;
        targetPitch = ((event.clientY / globalThis.innerHeight) * 2 - 1) * 0.1;
      };
      globalThis.addEventListener('pointermove', handlePointerMove);

      const syncColors = () => {
        uInk.value.set(readColor('--wa-sumi'));
        uAccent.value.set(readColor(accentVariable()));
        uFlowInk.value.set(inkFlowColor(isDark()));
        syncOpacities();
        handleScroll();
      };
      const themeObserver = new MutationObserver(syncColors);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      let visible = true;
      const handleVisibilityChange = () => {
        visible = document.visibilityState === 'visible';
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      let spin = 0;
      let tilt = 0;
      let fade = 1;
      let yaw = 0;
      let pitch = 0;
      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible) {
          return;
        }

        spin += 0.0018;
        tilt += (targetTilt - tilt) * 0.05;
        fade += (targetFade - fade) * 0.06;
        yaw += (targetYaw - yaw) * 0.03;
        pitch += (targetPitch - pitch) * 0.03;
        // Eased, so a flick of the wheel still plays out as a slow bleed
        // rather than a hard cut between the two glyphs.
        uProgress.value += (targetProgress - uProgress.value) * 0.05;
        // The ink field's clock, not our own: the flow we dissolve into has
        // to be the one on screen this very frame.
        uTime.value = inkFlowState.time;

        markGroup.rotation.y = spin + yaw;
        markGroup.rotation.x = tilt + pitch;

        uMainOpacity.value = (mainBase + Math.cos(spin) * 0.04) * fade;
        uGhostOpacity.value = ghostBase * fade;

        renderer.render({ scene, camera });
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        globalThis.removeEventListener('resize', resize);
        globalThis.removeEventListener('scroll', handleScroll);
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

  return (
    <div className="home-mark-wrap" aria-hidden="true">
      <div className="home-mark-stage">
        <div ref={containerRef} className="home-mark-canvas" />
        <Mark className="home-mark-fallback" />
      </div>
    </div>
  );
};
