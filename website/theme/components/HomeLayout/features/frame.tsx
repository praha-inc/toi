import type { FC, ReactNode } from 'react';

export type FrameProps = {
  children: ReactNode;
};

/**
 * A 隅 (sumi, corner) frame: four short L-shaped ink strokes marking the
 * corners of a panel, the way a mounted print is held to its board. The
 * corners pick up vermillion on hover — the one bit of motion on these
 * panels, in place of the default theme's 3D tilt and glare, which read as
 * plastic against paper.
 */
export const Frame: FC<FrameProps> = ({
  children,
}) => (
  <div className="home-frame">
    <div className="home-frame__inner">{children}</div>
    <span className="home-frame__corner home-frame__corner--tl" aria-hidden="true" />
    <span className="home-frame__corner home-frame__corner--tr" aria-hidden="true" />
    <span className="home-frame__corner home-frame__corner--bl" aria-hidden="true" />
    <span className="home-frame__corner home-frame__corner--br" aria-hidden="true" />
  </div>
);
