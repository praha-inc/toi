---
title: Mounting the Host
description: Why ToiHost is required, where components mounted by toi actually render, and its built-in accessibility semantics.
---

# Mounting the Host

`toi` doesn't render anything on its own — it registers a request in an internal store and waits for something to render it. `ToiHost` is that something: it subscribes to the store and renders every component currently mounted by `toi`.

```tsx
import { ToiHost } from '@praha/toi';

const App = () => (
  <>
    <YourApp />
    <ToiHost />
  </>
);
```

`ToiHost` needs to be mounted once, but it doesn't matter where — every call to `toi`, from anywhere in the app, renders into the same host. There's no need for one host per feature or per component type. Click "Show toast" a few times below to see several requests stack up inside the same host, each dismissible on its own:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useRef } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Toast: FC<ToiProps & { message: string }> = ({ ref, resolve, message }) => (
  <div ref={ref}>
    <p>{message}</p>
    <button onClick={() => resolve()}>Dismiss</button>
  </div>
);

export default function App() {
  const count = useRef(0);

  return (
    <>
      <button onClick={() => toi(Toast, { message: `Toast #${++count.current}` })}>
        Show toast
      </button>
      <ToiHost />
    </>
  );
}
```

## What it renders

`ToiHost` wraps its children in a `<section>` with `aria-live="polite"` and `aria-label="notifications"`, so screen readers announce dialogs and toasts as they're mounted:

```tsx
<section aria-live="polite" aria-label="notifications">
  {/* one entry per pending toi() call, in the order they were requested */}
</section>
```

Beyond that wrapper, `ToiHost` adds no markup, styling, or positioning of its own — each component you pass to `toi` is responsible for its own presentation (for example, a `<dialog>` that manages its own centering, or a toast that positions itself with CSS).

If `toi` is called before `ToiHost` is mounted, the request is simply queued in the store; it renders as soon as `ToiHost` mounts and reads the current snapshot.
