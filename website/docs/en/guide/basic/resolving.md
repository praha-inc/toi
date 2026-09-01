---
title: Resolving
description: Resolving with or without a value, calling resolve multiple times, and how exit animations delay unmounting.
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

## Calling resolve more than once

Calling `resolve` a second time has no effect — the first call wins, and the promise has already started settling. This makes it safe to wire `resolve` up to more than one event without guarding against double-firing yourself, for example both a button click and a backdrop click on a dialog.

## Exit animations

Resolving doesn't unmount the component right away. toi looks at the element attached to `ref` (which must implement the [`Animatable`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations) interface) and waits for every animation running on it or its descendants — except infinitely repeating ones — to finish, before removing the component from `ToiHost` and settling the promise.

This means a CSS or Web Animations exit transition triggered by `resolve` gets a chance to play out fully. Click "Dismiss" below and watch the fade-out finish before the toast disappears:

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
      <div
        ref={ref}
        className={closing ? 'toast--closing' : undefined}
        onAnimationEnd={() => { if (closing) resolve(); }}
      >
        <p>Saved!</p>
        <button onClick={() => setClosing(true)}>Dismiss</button>
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

Clicking "Dismiss" adds the class that starts the fade-out animation; `resolve` isn't called until that animation's `animationend` fires, so the component (and the promise) stays alive for exactly as long as the exit transition takes.

If `ref` was never attached to an element, or the element has no running animations, `resolve` settles the promise on the very next animation frame.
