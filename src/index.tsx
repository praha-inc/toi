'use client';

import { createRef, Fragment, useSyncExternalStore } from 'react';

import { createStore } from './store';

import type { FC, RefCallback } from 'react';

const store = createStore();

export type ToiProps<Response> = {
  ref?: RefCallback<Animatable> | undefined;
  resolve: (response: Response) => void;
};

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
