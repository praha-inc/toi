'use client';

import { createRef, Fragment, useSyncExternalStore } from 'react';

import { createStore } from './store';

import type { FC, RefCallback } from 'react';

const store = createStore();

export type ToiResolve<Response> = (response: Response) => void;

/**
 * Props injected into the component passed to {@link toi}.
 *
 * @example
 * ```tsx
 * const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * );
 * ```
 *
 * @example
 * Extending a native element's props:
 * ```tsx
 * type ConfirmProps = ComponentProps<'dialog'> & ToiProps<boolean>;
 *
 * const Confirm: FC<ConfirmProps> = ({ ref, resolve, ...props }) => (
 *   <dialog {...props} ref={ref} open>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * );
 * ```
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
  resolve: ToiResolve<Response>;
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
 *
 * @example
 * ```tsx
 * const confirmed = await toi<boolean>(({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * ));
 * ```
 *
 * @example
 * Passing a predefined component:
 * ```tsx
 * const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * );
 *
 * const confirmed = await toi(Confirm);
 * ```
 */
export const toi = <Response,>(Component: FC<ToiProps<Response>>): Promise<Response> => {
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
 * Binds `Component` to {@link toi}, returning a reusable function that
 * mounts it and resolves with its response each time it's called.
 *
 * @param Component - Component to render, receiving {@link ToiProps}.
 * @returns A function that invokes {@link toi} with `Component`.
 *
 * @example
 * ```tsx
 * const confirm = toi.fn<boolean>(({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * ));
 *
 * const confirmed = await confirm();
 * ```
 *
 * @example
 * Passing a predefined component:
 * ```tsx
 * const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * );
 *
 * const confirm = toi.fn(Confirm);
 * const confirmed = await confirm();
 * ```
 */
toi.fn = <Response,>(Component: FC<ToiProps<Response>>): () => Promise<Response> => {
  return () => toi(Component);
};

/**
 * Renders all components currently requested via {@link toi}.
 *
 * Must be mounted once for {@link toi} to have anywhere to render its components.
 *
 * @example
 * ```tsx
 * const App = () => (
 *   <>
 *     <YourApp />
 *     <ToiHost />
 *   </>
 * );
 * ```
 */
export const ToiHost: FC = () => {
  const requests = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return (
    <section aria-live="polite" aria-label="notifications">
      {requests.map((request) => (
        <Fragment key={request.id}>
          {request.render()}
        </Fragment>
      ))}
    </section>
  );
};
