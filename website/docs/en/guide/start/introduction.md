---
title: Introduction
description: What toi is, the problem it solves, and how mounting, resolving, and exit animations fit together.
---

# Introduction

Confirmation dialogs, toasts, and other "ask the user something, then continue" UI are naturally imperative: you want to trigger them from inside an event handler and get an answer back. `window.confirm` is the simplest way to do that. But `window.confirm` can't be styled, animated, or made accessible the way a real component can.

Building that imperative feel with your own components usually means state for "is it open", state for "what was it called with", and a way to resolve a promise from inside the component when it's done. toi packages that pattern into a single function call.

```tsx
const confirmed = await toi(Confirm);
```

## How it works

toi has three moving parts:

- **`toi`** — mounts a component and returns a promise. Call it from anywhere, including inside an event handler.
- **`ToiHost`** — renders every component currently mounted by `toi`. It needs to exist somewhere in your tree, once.
- **`ToiProps`** — the `ref` and `resolve` props toi injects into the component you pass it. Calling `resolve` is what settles the promise `toi` returned.

Try it below — click "Delete", then "OK" or "Cancel", and watch the result appear:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

export default function App() {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  return (
    <>
      <button onClick={async () => setConfirmed(await toi(Confirm))}>
        Delete
      </button>
      {confirmed !== null && <p>confirmed: {String(confirmed)}</p>}
      <ToiHost />
    </>
  );
}
```

`Confirm` is a completely ordinary component — no context, no imperative ref API to learn. The only requirement is that it accepts `resolve` (and optionally forwards `ref` to its animatable root element).

## Headless by design

toi doesn't render any markup, styles, or animations of its own. `ToiHost` only renders whatever components are currently mounted; everything else — the `<dialog>`, the buttons, the transitions — is your component. This keeps toi usable with any design system or styling approach.

## Exit animations

Calling `resolve` doesn't unmount the component immediately. toi waits for any running animations on the element attached to `ref` to finish first, so a fade-out or slide-out transition can play before the component is removed and the promise resolves. See [Resolving](../basic/resolving) for details.
