import type { FC } from 'react';

/**
 * The toi mark: 問 taken apart and rebuilt.
 *
 * 問 is 門 (a gate) with 口 (a mouth) set inside it — a question is a voice at
 * the gate, waiting for whoever is inside to answer. The mark keeps that
 * structure literally: the gate is drawn as a constructed, geometric skeleton
 * in ink, and the mouth is replaced by a vermillion seal (印), the answer
 * already stamped and waiting inside. Read as a whole it is still 問.
 *
 * Everything is defined on a 100×100 grid and reused from here: the React
 * `<Mark>` in the hero and footer, the WebGL backdrop's mask textures
 * (`drawStrokeOutline` / `drawSealOutline`), and — copied by hand, since
 * they're plain static files — the nav logo and favicon under `docs/public/`.
 */

/** 門 — both leaves, drawn as joined paths so every corner mitres cleanly. */
export const MARK_GATE_PATH = 'M14 88V12H42V40H14M14 26H42M86 88V12H58V40H86M58 26H86';

/** 口 as a seal: a hand-cut quadrilateral, deliberately a hair off square. */
export const MARK_SEAL_PATH = 'M38 54L62 55L61.5 80L38.5 79Z';

/**
 * 答 minus its 口 — the strokes that, set around the very same seal, turn
 * the question into the answer: 竹 (bamboo) across the top, then the roof
 * and bar of 合 (人 and 一) resting on the seal, which is 合's 口. Built in
 * the same constructed style as the gate so the two read as one family;
 * the backdrop mark dissolves 門 into the ink and lets these surface in its
 * place as you scroll (see `HomeMark`).
 */
export const MARK_ANSWER_PATH = 'M23 7L31 20V30M18 20H44M61 7L69 20V30M56 20H82M14 47L50 31L86 47M36 45.5H64';

/**
 * The gate taken apart, for the backdrop to dissolve one piece at a time:
 * the left leaf's frame (its top, side, bottom and middle bars), the left
 * post, then the same two for the right leaf. Together they are exactly
 * `MARK_GATE_PATH`. At the top corner, where the post meets the frame's top
 * bar in a mitre, both pieces are run half a stroke past the join so each
 * covers the corner square on its own — otherwise whichever goes first
 * would leave the other with a notch.
 */
export const MARK_GATE_PARTS = [
  'M10.5 12H42V40H14M14 26H42',
  'M14 8.5V88',
  'M89.5 12H58V40H86M58 26H86',
  'M86 8.5V88',
] as const;

/**
 * The answer taken apart the same way, in the order it gathers: the left
 * 竹, the right 竹, the roof of 合, then its bar. Together they are exactly
 * `MARK_ANSWER_PATH`.
 */
export const MARK_ANSWER_PARTS = [
  'M23 7L31 20V30M18 20H44',
  'M61 7L69 20V30M56 20H82',
  'M14 47L50 31L86 47',
  'M36 45.5H64',
] as const;

/** Stroke width for the gate and the answer strokes, in grid units. */
export const MARK_STROKE = 7;

const withGrid = (context: CanvasRenderingContext2D, size: number, draw: () => void): void => {
  context.save();
  context.scale(size / 100, size / 100);
  context.lineJoin = 'miter';
  context.lineCap = 'butt';
  context.strokeStyle = '#fff';
  draw();
  context.restore();
};

type Point = readonly [number, number];

/**
 * The mark's paths only ever use absolute M / L / H / V, so this is all the
 * parsing they need: each subpath becomes a polyline.
 */
const toPolylines = (path: string): Point[][] => {
  const tokens = path.match(/[MLHV]|-?\d*\.?\d+/g) ?? [];
  const polylines: Point[][] = [];
  let current: Point[] = [];
  let cursor: Point = [0, 0];

  for (let index = 0; index < tokens.length;) {
    const command = tokens[index++];
    switch (command) {
      case 'M': {
        cursor = [Number(tokens[index++]), Number(tokens[index++])];
        current = [cursor];
        polylines.push(current);
        break;
      }
      case 'L': {
        cursor = [Number(tokens[index++]), Number(tokens[index++])];
        current.push(cursor);
        break;
      }
      case 'H': {
        cursor = [Number(tokens[index++]), cursor[1]];
        current.push(cursor);
        break;
      }
      case 'V': {
        cursor = [cursor[0], Number(tokens[index++])];
        current.push(cursor);
        break;
      }
      default: {
        throw new Error(`Unsupported path command: ${command}`);
      }
    }
  }

  return polylines;
};

const pullTowards = ([x, y]: Point, [tx, ty]: Point, distance: number): Point => {
  const length = Math.hypot(tx - x, ty - y) || 1;
  return [x + ((tx - x) / length) * distance, y + ((ty - y) / length) * distance];
};

/** The same polyline with both free ends pulled in by `distance`. */
const shortenEnds = (polyline: Point[], distance: number): Point[] => {
  if (polyline.length < 2) {
    return polyline;
  }
  const points = [...polyline];
  points[0] = pullTowards(points[0]!, points[1]!, distance);
  points[points.length - 1] = pullTowards(points.at(-1)!, points.at(-2)!, distance);
  return points;
};

const toPath2D = (polylines: Point[][]): Path2D => {
  const path = new Path2D();
  for (const polyline of polylines) {
    polyline.forEach(([x, y], index) => (index === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
  }
  return path;
};

/**
 * Draws a set of thick constructed strokes (the gate, or the answer) as line
 * art — the outline of each stroke — in white onto a canvas, for use as an
 * alpha mask. `lineWidth` is in grid units (1 = 1% of `size`).
 *
 * To draw one *piece* of a glyph so that the pieces add back up to the whole
 * glyph's outline, pass the whole glyph as `whole`: the piece is laid down
 * solid but hollowed with the whole, so at a join the outline still runs
 * around the join rather than closing the piece off with a cap of its own.
 */
export const drawStrokeOutline = (
  context: CanvasRenderingContext2D,
  size: number,
  path: string,
  lineWidth: number,
  whole: string = path,
): void => {
  const solid = toPolylines(path);
  const hollow = toPolylines(whole);

  withGrid(context, size, () => {
    // Lay the strokes down solid, then knock their interiors back out — the
    // union of all the strokes is what gets hollowed, so where a bar meets a
    // post the outline runs around the join rather than through it. The
    // hollowing stroke stops `lineWidth` short of each free end so the
    // outline closes there too instead of running off open like a hatch;
    // an end that sits inside another stroke is hollowed by that one anyway.
    context.lineWidth = MARK_STROKE;
    context.stroke(toPath2D(solid));
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = MARK_STROKE - lineWidth * 2;
    context.stroke(toPath2D(hollow.map((polyline) => shortenEnds(polyline, lineWidth))));
  });
};

/** Draws the seal's edge in white onto a canvas, for use as an alpha mask. */
export const drawSealOutline = (context: CanvasRenderingContext2D, size: number, lineWidth: number): void => {
  const seal = new Path2D(MARK_SEAL_PATH);

  withGrid(context, size, () => {
    context.lineWidth = lineWidth;
    context.stroke(seal);
  });
};

type MarkProps = {
  className?: string;
};

export const Mark: FC<MarkProps> = ({
  className,
}) => (
  <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <path
      className="wa-mark__gate"
      d={MARK_GATE_PATH}
      fill="none"
      stroke="currentColor"
      strokeWidth={MARK_STROKE}
      strokeLinejoin="miter"
      strokeLinecap="butt"
      pathLength={1}
    />
    <path className="wa-mark__seal" d={MARK_SEAL_PATH} fill="var(--wa-shu)" />
  </svg>
);
