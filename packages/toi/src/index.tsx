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
export type ToiResolve<Response> = [Response] extends [void] ? () => void : (response: Response) => void;

/**
 * Type of the `reject` callback passed to a component rendered by {@link toi},
 * which rejects the promise it returned with the given reason.
 *
 * Intended for when the component can no longer answer: work it performs
 * before resolving fails, or the user navigates away. Ordinary dismissals,
 * such as a cancel button, should `resolve` instead.
 *
 * When `reason` is omitted, the promise is rejected with a `DOMException` named
 * `AbortError`, following the {@link AbortSignal} convention.
 */
export type ToiReject = (reason?: unknown) => void;

/** The `Response` type a component resolves with, extracted from its props or its own type. */
export type InferToiResponse<T> = T extends FC<infer Props>
  ? InferToiResponse<Props>
  : T extends { resolve: () => void }
    ? void
    : T extends { resolve: (response: infer Response) => void }
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
 * Rejecting when work done before resolving fails, so `await toi(Confirm)` throws:
 * ```tsx
 * const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve, reject }) => (
 *   <dialog ref={ref} open>
 *     <button onClick={() => resolve(false)}>Cancel</button>
 *     <button
 *       onClick={async () => {
 *         try {
 *           await deleteItem();
 *           resolve(true);
 *         } catch (error) {
 *           reject(error);
 *         }
 *       }}
 *     >
 *       Delete
 *     </button>
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
   * detect when its exit animations have finished before settling.
   */
  ref?: RefCallback<Animatable> | undefined;
  /**
   * Resolves the promise returned by {@link toi} with the given response.
   * Has no effect once either `resolve` or `reject` has been called.
   */
  resolve: ToiResolve<Response>;
  /**
   * Rejects the promise returned by {@link toi} with the given reason, or with
   * a `DOMException` named `AbortError` when called without one.
   *
   * Use it when the component can no longer answer, such as when work done
   * before resolving fails or the user navigates away. Ordinary dismissals,
   * such as a cancel button, should `resolve` instead.
   *
   * Has no effect once either `resolve` or `reject` has been called.
   */
  reject: ToiReject;
};

type ToiPropsLike<Response> = Omit<ToiProps<Response>, 'reject'> & { reject?: ToiReject | undefined };

type AnyToiProps = Omit<ToiPropsLike<never>, 'resolve'> & { resolve: (response: never) => void };

/** Runtime implementation shared by {@link toi} and {@link toi.fn}, untyped to bypass their overloads. */
const mount = (Component: FC<Record<string, unknown>>, props?: Record<string, unknown>): Promise<unknown> => {
  return new Promise((resolvePromise, rejectPromise) => {
    store.add((id) => {
      const ref = createRef<Animatable>();
      const settled = createRef<boolean>();

      /** Waits for exit animations, unmounts the component, then settles the promise via `settlePromise`. */
      const settle = (settlePromise: () => void) => {
        if (settled.current) return;
        settled.current = true;

        requestAnimationFrame(() => {
          const animations = (ref.current?.getAnimations({ subtree: true }) ?? [])
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);

          void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            store.remove(id);
            settlePromise();
          });
        });
      };

      const resolve = (response: unknown) => {
        settle(() => resolvePromise(response));
      };

      const reject = (...args: Parameters<ToiReject>) => {
        // oxlint-disable-next-line prefer-promise-reject-errors -- mirrors `Promise.reject`, which accepts any reason
        settle(() => rejectPromise(args.length === 0 ? new DOMException('The toi request was rejected.', 'AbortError') : args[0]));
      };

      return (
        <Component
          {...props}
          ref={(element: Animatable | null) => { ref.current = element; }}
          resolve={resolve}
          reject={reject}
        />
      );
    });
  });
};

/**
 * Mounts `Component` into the {@link ToiHost} and returns a promise
 * that resolves with the value passed to `resolve`, or rejects with the
 * reason passed to `reject`.
 *
 * Once `resolve` or `reject` is called, the component is kept mounted until any
 * running animations (excluding infinite ones) on its ref'd element finish, then
 * it is removed from the host and the promise settles.
 *
 * `Response` and any additional props are inferred from `Component`'s own props
 * type; pass a second argument for any additional props it requires beyond
 * {@link ToiProps}.
 *
 * @param Component - Component to render, receiving {@link ToiProps}.
 * @param props - Additional props to pass to `Component`, if it requires any.
 * @returns A promise resolving with the response passed to `resolve`, or
 * rejecting with the reason passed to `reject`.
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
  Component: Component & AssertExtends<Parameters<Component>[0], AnyToiProps>,
  ...[props]: PropsArgs<Omit<Parameters<Component>[0], keyof ToiProps<never>>>
): Promise<InferToiResponse<Component>>;
/**
 * Mounts `Component` into the {@link ToiHost} and returns a promise
 * that resolves with the value passed to `resolve`, or rejects with the
 * reason passed to `reject`.
 *
 * Once `resolve` or `reject` is called, the component is kept mounted until any
 * running animations (excluding infinite ones) on its ref'd element finish, then
 * it is removed from the host and the promise settles.
 *
 * Use this overload to pass an inline `Component` whose props can't be inferred
 * on their own; annotate `Response` explicitly so its `props` get typed as
 * {@link ToiProps}. If `Component` requires additional props beyond
 * {@link ToiProps}, annotate `Props` explicitly as well and pass them as `props`.
 *
 * @param Component - Component to render, receiving {@link ToiProps} and `props`.
 * @param props - Additional props to pass to `Component`, if it requires any.
 * @returns A promise resolving with the response passed to `resolve`, or
 * rejecting with the reason passed to `reject`.
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
  Component: FC<Props> & AssertExtends<Props, ToiPropsLike<Response>>,
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
    Component: FC<Props> & AssertExtends<Props, AnyToiProps>,
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
    Component: FC<Props> & AssertExtends<Props, AnyToiProps>,
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
    Component: FC<Props> & AssertExtends<Props, ToiPropsLike<Response>>,
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
    Component: FC<Props> & AssertExtends<Props, ToiPropsLike<Response>>,
    defaultProps: Omit<Props, keyof ToiProps<never>>,
  ): (props?: Omit<Props, keyof ToiProps<never>>) => Promise<Response>;
  export function fn(Component: FC<Record<string, unknown>>, defaultProps?: Record<string, unknown>) {
    return (props?: Record<string, unknown>) => mount(Component, { ...defaultProps, ...props });
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
