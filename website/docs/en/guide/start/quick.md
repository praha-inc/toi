---
title: Quick Start
description: Install toi, mount ToiHost, and await your first component.
---

# Quick Start

## Installation

```bash
npm install @praha/toi
```

## Mount the host

Render `ToiHost` once, anywhere in your component tree, to give `toi` a place to mount the components it renders.

```tsx
import { ToiHost } from '@praha/toi';

const App = () => (
  <>
    <YourApp />
    <ToiHost />
  </>
);
```

## Await a component

Call `toi` with a component to mount it into `ToiHost` and await the value passed to its `resolve` prop.

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
    <p>Are you sure you want to delete this?</p>
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

`resolve` can also be called with no argument, for components — such as toasts — that don't need to resolve with a value:

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

That's the whole API surface for basic usage. Continue to [Mounting the Host](../basic/mounting) and [Resolving](../basic/resolving) to see how the lifecycle behaves in more detail.
