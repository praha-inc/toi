'use client';

import { createRef, Fragment, useSyncExternalStore } from 'react';

import { createStore } from './store';

import type { AssertExtends } from './types/assert-extends';
import type { PropsArgs } from './types/props-args';
import type { FC, RefCallback } from 'react';

const store = createStore();

/**
 * Type of the `resolve` callback passed to a component rendered by {@link toi},
 * which resolves the promise it returned with the given response.
 */
export type ToiResolve<Response> = (response: Response) => void;

/** The `Response` type a component resolves with, extracted from its props or its own type. */
export type InferToiResponse<T> = T extends FC<infer Props>
  ? InferToiResponse<Props>
  : T extends { resolve: ToiResolve<infer Response> }
    ? Response
    : never;

/**
 * Props injected into the component passed to {@link toi}.
 *
 * `Response` defaults to `void`, for components that don't resolve with a value.
 *
 * @example
 * Resolving without a value:
 * ```tsx
 * const Confirm: FC<ToiProps> = ({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve()}>OK</button>
 *   </dialog>
 * );
 * ```
 *
 * @example
 * ```tsx
 * const Confirm: FC<ToiProps> = ({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve()}>OK</button>
 *   </dialog>
 * );
 * ```
 *
 * @example
 * Resolving with a value:
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
 * Extending a native element's props, resolving with a value:
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
export type ToiProps<Response = void> = {
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

/** Runtime implementation shared by {@link toi} and {@link toi.fn}, untyped to bypass their overloads. */
const mount = (Component: FC<Record<string, unknown>>, props?: Record<string, unknown>): Promise<unknown> => {
  return new Promise((resolvePromise) => {
    store.add((id) => {
      const ref = createRef<Animatable>();
      const resolved = createRef<boolean>();

      const resolve = (response: unknown) => {
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
          {...props}
          ref={(element: Animatable | null) => { ref.current = element; }}
          resolve={resolve}
        />
      );
    });
  });
};

/**
 * Mounts `Component` into the {@link ToiHost} and returns a promise
 * that resolves with the value passed to `resolve`.
 *
 * Once `resolve` is called, the component is kept mounted until any running
 * animations (excluding infinite ones) on its ref'd element finish, then it
 * is removed from the host and the promise resolves.
 *
 * `Response` and any additional props are inferred from `Component`'s own props
 * type; pass a second argument for any additional props it requires beyond
 * {@link ToiProps}.
 *
 * @param Component - Component to render, receiving {@link ToiProps}.
 * @param props - Additional props to pass to `Component`, if it requires any.
 * @returns A promise resolving with the response passed to `resolve`.
 *
 * @example
 * Passing a predefined component that resolves without a value:
 * ```tsx
 * const Confirm: FC<ToiProps> = ({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve()}>OK</button>
 *   </dialog>
 * );
 *
 * await toi(Confirm);
 * ```
 *
 * @example
 * Passing a predefined component that resolves with a value:
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
export function toi<Component extends FC<never>>(
  Component: Component & AssertExtends<Parameters<Component>[0], ToiProps<never>>,
  ...[props]: PropsArgs<Omit<Parameters<Component>[0], keyof ToiProps<never>>>
): Promise<InferToiResponse<Component>>;
/**
 * Mounts `Component` into the {@link ToiHost} and returns a promise
 * that resolves with the value passed to `resolve`.
 *
 * Once `resolve` is called, the component is kept mounted until any running
 * animations (excluding infinite ones) on its ref'd element finish, then it
 * is removed from the host and the promise resolves.
 *
 * Use this overload to pass an inline `Component` whose props can't be inferred
 * on their own; annotate `Response` explicitly so its `props` get typed as
 * {@link ToiProps}. If `Component` requires additional props beyond
 * {@link ToiProps}, annotate `Props` explicitly as well and pass them as `props`.
 *
 * @param Component - Component to render, receiving {@link ToiProps} and `props`.
 * @param props - Additional props to pass to `Component`, if it requires any.
 * @returns A promise resolving with the response passed to `resolve`.
 *
 * @example
 * Resolving without a value:
 * ```tsx
 * await toi(({ ref, resolve }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve()}>OK</button>
 *   </dialog>
 * ));
 * ```
 *
 * @example
 * Resolving with a value:
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
 * With additional props, resolving without a value:
 * ```tsx
 * type ConfirmProps = ToiProps & { message: string };
 *
 * await toi<void, ConfirmProps>(({ ref, resolve, message }) => (
 *   <dialog ref={ref} open>
 *     <p>{message}</p>
 *     <button onClick={() => resolve()}>OK</button>
 *   </dialog>
 * ), { message: 'Saved!' });
 * ```
 *
 * @example
 * With additional props, resolving with a value:
 * ```tsx
 * type ConfirmProps = ToiProps<boolean> & { message: string };
 *
 * const confirmed = await toi<boolean, ConfirmProps>(({ ref, resolve, message }) => (
 *   <dialog ref={ref} open>
 *     <p>{message}</p>
 *     <button onClick={() => resolve(true)}>OK</button>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *   </dialog>
 * ), { message: 'Are you sure?' });
 * ```
 */
export function toi<Response = void, Props extends Record<string, unknown> = ToiProps<Response>>(
  Component: FC<Props> & AssertExtends<Props, ToiProps<Response>>,
  ...[props]: PropsArgs<Omit<Props, keyof ToiProps<never>>>
): Promise<Response>;
export function toi(Component: FC<Record<string, unknown>>, props?: Record<string, unknown>): Promise<unknown> {
  return mount(Component, props);
}

// oxlint-disable-next-line @typescript-eslint/no-namespace -- merges `fn` onto the `toi` function
export namespace toi {
  /**
   * Binds `Component` to {@link toi}, returning a reusable function that
   * mounts it and resolves with its response each time it's called.
   *
   * `Response` and any additional props are inferred from `Component`'s own
   * props type; the returned function takes a second argument for any
   * additional props it requires beyond {@link ToiProps}.
   *
   * @param Component - Component to render, receiving {@link ToiProps}.
   * @returns A function that invokes {@link toi} with `Component`, taking any
   * additional props `Component` requires.
   *
   * @example
   * Passing a predefined component that resolves without a value:
   * ```tsx
   * const Confirm: FC<ToiProps> = ({ ref, resolve }) => (
   *   <dialog ref={ref} open>
   *     <button onClick={() => resolve()}>OK</button>
   *   </dialog>
   * );
   *
   * const confirm = toi.fn(Confirm);
   * await confirm();
   * ```
   *
   * @example
   * Passing a predefined component that resolves with a value:
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
  export function fn<Props extends Record<string, unknown>>(
    Component: FC<Props> & AssertExtends<Props, ToiProps<never>>,
  ): (...[props]: PropsArgs<Omit<Props, keyof ToiProps<never>>>) => Promise<InferToiResponse<Props>>;
  /**
   * Binds `Component` to {@link toi}, returning a reusable function that
   * mounts it and resolves with its response each time it's called.
   *
   * `Response` and any additional props are inferred from `Component`'s own
   * props type. `defaultProps` is used whenever the returned function is
   * called without its own `props` argument; pass one to override it.
   *
   * @param Component - Component to render, receiving {@link ToiProps}.
   * @param defaultProps - Default additional props to pass to `Component`.
   * @returns A function that invokes {@link toi} with `Component`, optionally
   * overriding `defaultProps`.
   *
   * @example
   * Resolving without a value:
   * ```tsx
   * const Confirm: FC<ToiProps & { message: string }> = ({ ref, resolve, message }) => (
   *   <dialog ref={ref} open>
   *     <p>{message}</p>
   *     <button onClick={() => resolve()}>OK</button>
   *   </dialog>
   * );
   *
   * const confirm = toi.fn(Confirm, { message: 'Saved!' });
   * await confirm();
   * await confirm({ message: 'Deleted!' });
   * ```
   *
   * @example
   * Resolving with a value:
   * ```tsx
   * const Confirm: FC<ToiProps<boolean> & { message: string }> = ({ ref, resolve, message }) => (
   *   <dialog ref={ref} open>
   *     <p>{message}</p>
   *     <button onClick={() => resolve(true)}>OK</button>
   *     <button onClick={() => resolve(false)}>Cancel</button>
   *   </dialog>
   * );
   *
   * const confirm = toi.fn(Confirm, { message: 'Are you sure?' });
   * const confirmed = await confirm();
   * const confirmedWithOverride = await confirm({ message: 'Really?' });
   * ```
   */
  export function fn<Props extends Record<string, unknown>>(
    Component: FC<Props> & AssertExtends<Props, ToiProps<never>>,
    defaultProps: Omit<Props, keyof ToiProps<never>>,
  ): (props?: Omit<Props, keyof ToiProps<never>>) => Promise<InferToiResponse<Props>>;
  /**
   * Binds `Component` to {@link toi}, returning a reusable function that
   * mounts it and resolves with its response each time it's called.
   *
   * Use this overload to pass an inline `Component` whose props can't be
   * inferred on their own; annotate `Response` explicitly so its `props` get
   * typed as {@link ToiProps}.
   *
   * @param Component - Component to render, receiving {@link ToiProps}.
   * @returns A function that invokes {@link toi} with `Component`.
   *
   * @example
   * Resolving without a value:
   * ```tsx
   * const confirm = toi.fn(({ ref, resolve }) => (
   *   <dialog ref={ref} open>
   *     <button onClick={() => resolve()}>OK</button>
   *   </dialog>
   * ));
   *
   * await confirm();
   * ```
   *
   * @example
   * Resolving with a value:
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
   */
  export function fn<Response = void, Props extends Record<string, unknown> = ToiProps<Response>>(
    Component: FC<Props> & AssertExtends<Props, ToiProps<Response>>,
  ): (...[props]: PropsArgs<Omit<Props, keyof ToiProps<never>>>) => Promise<Response>;
  /**
   * Binds `Component` to {@link toi}, returning a reusable function that
   * mounts it and resolves with its response each time it's called.
   *
   * Use this overload to pass an inline `Component` together with the
   * additional props it requires beyond {@link ToiProps}; annotate `Response`
   * (and, if it can't be inferred from `defaultProps`, `Props`) explicitly.
   * `defaultProps` is used whenever the returned function is called without
   * its own `props` argument; pass one to override it.
   *
   * @param Component - Component to render, receiving {@link ToiProps} and `props`.
   * @param defaultProps - Default additional props to pass to `Component`.
   * @returns A function that invokes {@link toi} with `Component`, optionally
   * overriding `defaultProps`.
   *
   * @example
   * Resolving without a value:
   * ```tsx
   * type ConfirmProps = ToiProps & { message: string };
   *
   * const confirm = toi.fn<void, ConfirmProps>((props) => (
   *   <dialog ref={props.ref} open>
   *     <p>{props.message}</p>
   *     <button onClick={() => props.resolve()}>OK</button>
   *   </dialog>
   * ), { message: 'Saved!' });
   *
   * await confirm();
   * await confirm({ message: 'Deleted!' });
   * ```
   *
   * @example
   * Resolving with a value:
   * ```tsx
   * type ConfirmProps = ToiProps<boolean> & { message: string };
   *
   * const confirm = toi.fn<boolean, ConfirmProps>((props) => (
   *   <dialog ref={props.ref} open>
   *     <p>{props.message}</p>
   *     <button onClick={() => props.resolve(true)}>OK</button>
   *     <button onClick={() => props.resolve(false)}>Cancel</button>
   *   </dialog>
   * ), { message: 'Are you sure?' });
   *
   * const confirmed = await confirm();
   * const confirmedWithOverride = await confirm({ message: 'Really?' });
   * ```
   */
  export function fn<Response = void, Props extends Record<string, unknown> = ToiProps<Response>>(
    Component: FC<Props> & AssertExtends<Props, ToiProps<Response>>,
    defaultProps: Omit<Props, keyof ToiProps<never>>,
  ): (props?: Omit<Props, keyof ToiProps<never>>) => Promise<Response>;
  export function fn(Component: FC<Record<string, unknown>>, defaultProps?: Record<string, unknown>) {
    return (props?: Record<string, unknown>) => mount(Component, props ?? defaultProps);
  }
}

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
