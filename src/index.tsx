'use client';

import { createRef, Fragment, useSyncExternalStore } from 'react';

import { createStore } from './store';

import type { FC, RefCallback } from 'react';

const store = createStore();

/**
 * Props injected into the component passed to {@link toi}.
 */
export type ToiProps<Response> = {
  /**
   * Ref to attach to the animatable root element of the component, used to
   * detect when its exit animations have finished before resolving.
   */
  ref?: RefCallback<Animatable> | undefined;
  /**
   * Resolves the promise returned by {@link toi} with the given response.
   * Calling this multiple times has no effect after the first call.
   */
  resolve: (response: Response) => void;
};

/**
 * Mounts `Component` into the {@link ToiHost} and returns a promise
 * that resolves with the value passed to `resolve`.
 *
 * Once `resolve` is called, the component is kept mounted until any running
 * animations (excluding infinite ones) on its ref'd element finish, then it
 * is removed from the host and the promise resolves.
 *
 * @param Component - Component to render, receiving {@link ToiProps}.
 * @returns A promise resolving with the response passed to `resolve`.
 */
export const toi = <Response,>(Component: FC<ToiProps<Response>>) => {
  return new Promise((resolvePromise) => {
    store.add((id) => {
      const ref = createRef<Animatable>();
      const resolved = createRef<boolean>();

      const resolve = (response: Response) => {
        if (resolved.current) return;
        resolved.current = true;

        requestAnimationFrame(() => {
          const animations = (ref.current?.getAnimations({ subtree: true }) ?? [])
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);

          void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            store.remove(id);
            resolvePromise(response);
          });
        });
      };

      return (
        <Component
          ref={(element) => { ref.current = element; }}
          resolve={resolve}
        />
      );
    });
  });
};

/**
 * Renders all components currently requested via {@link toi}.
 *
 * Must be mounted once for {@link toi} to have anywhere to render its components.
 */
export const ToiHost: FC = () => {
  const requests = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return (
    <>
      {requests.map((request) => (
        <Fragment key={request.id}>
          {request.render()}
        </Fragment>
      ))}
    </>
  );
};
