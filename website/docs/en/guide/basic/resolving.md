---
title: Resolving
description: Resolving with or without a value, rejecting instead, calling resolve or reject multiple times, and how exit animations delay unmounting.
---

# Resolving

Every component `toi` mounts receives a `resolve` prop, typed as `ToiResolve<Response>`. Calling it settles the promise `toi` returned with the value you pass.

```tsx
const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

const confirmed = await toi(Confirm);
```

## Resolving without a value

`Response` defaults to `void`, so components that don't need to report anything back — such as a toast that's just dismissed — can call `resolve()` with no argument:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Toast: FC<ToiProps> = ({ ref, resolve }) => (
  <div ref={ref}>
    <p>Saved!</p>
    <button onClick={() => resolve()}>Dismiss</button>
  </div>
);

export default function App() {
  return (
    <>
      <button onClick={() => toi(Toast)}>Save</button>
      <ToiHost />
    </>
  );
}
```

## Rejecting

Alongside `resolve`, every component also receives a `reject` prop, typed as `ToiReject`. Calling it settles the promise `toi` returned by rejecting it, so the `await` throws instead of returning a value.

`reject` is for when the component can no longer answer — not for ordinary outcomes like the user closing a dialog. There are two typical cases:

- **Work done before resolving fails.** A dialog that performs an action before resolving — submitting a form, deleting an item — has nothing to answer with if that action throws. Pass the error to `reject` so it reaches the caller.
- **The request is abandoned.** The user navigates to another page, or the component is otherwise torn down before it was answered. Call `reject()` with no argument.

```tsx
const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve, reject }) => (
  <dialog ref={ref} open>
    <button onClick={() => resolve(false)}>Cancel</button>
    <button
      onClick={async () => {
        try {
          await deleteItem();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }}
    >
      Delete
    </button>
  </dialog>
);

try {
  const deleted = await toi(Confirm);
  // Delete succeeded (true) or Cancel was clicked (false)
} catch (error) {
  // deleteItem() failed
}
```

`reject` accepts any reason, just like `Promise.reject`. When called without one, the promise is rejected with a `DOMException` named `AbortError` — the same convention `AbortSignal` uses — so callers can tell an abandoned request apart from a genuine failure with `error.name === 'AbortError'`.

For a dismissal the caller expects and handles — a confirm dialog's "Cancel" button, a toast being closed — `resolve` with a value (or with nothing) instead, as `Confirm` above does. That keeps the happy path free of `try`/`catch` and reserves rejection for things that actually went wrong.

Note that an unhandled rejection surfaces as an error in the console, so make sure code awaiting a component that may reject catches it.

## Calling resolve or reject more than once

Calling `resolve` or `reject` a second time has no effect — the first call of either wins, and the promise has already started settling. This makes it safe to wire them up to more than one event without guarding against double-firing yourself, for example both a button click and a backdrop click on a dialog.

## Exit animations

Resolving (or rejecting) doesn't unmount the component right away. toi looks at the element attached to `ref` (which must implement the [`Animatable`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations) interface) and waits for every animation running on it or its descendants — except infinitely repeating ones — to finish, before removing the component from `ToiHost` and settling the promise.

This means a CSS or Web Animations exit transition started alongside `resolve` gets a chance to play out fully. Click "Dismiss" below and watch the fade-out finish before the toast disappears:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Toast: FC<ToiProps> = ({ ref, resolve }) => {
  const [closing, setClosing] = useState(false);

  return (
    <>
      <style>{`
        @keyframes toast-fade-out {
          to { opacity: 0; }
        }
        .toast--closing {
          animation: toast-fade-out 600ms ease-out forwards;
        }
      `}</style>
      <div ref={ref} className={closing ? 'toast--closing' : undefined}>
        <p>Saved!</p>
        <button
          onClick={() => {
            setClosing(true);
            resolve();
          }}
        >
          Dismiss
        </button>
      </div>
    </>
  );
};

export default function App() {
  return (
    <>
      <button onClick={() => toi(Toast)}>Save</button>
      <ToiHost />
    </>
  );
}
```

Clicking "Dismiss" adds the class that starts the fade-out animation and calls `resolve` in the same handler. toi doesn't unmount the toast until that animation finishes, so the component (and the promise) stays alive for exactly as long as the exit transition takes — with no `animationend` bookkeeping on your side.

If `ref` was never attached to an element, or the element has no running animations, `resolve` settles the promise on the very next animation frame.
