---
title: Reusable Functions
description: Using toi.fn to bind a component to toi once and reuse the resulting function, optionally with default props.
---

# Reusable Functions

Calling `toi(Confirm)` every time you need a confirmation works, but repeating the same component reference at every call site is easy to get wrong. `toi.fn` binds a component to `toi` once, returning a function you can call as many times as needed:

```tsx
const confirm = toi.fn(Confirm);
const confirmed = await confirm();
```

Each call to `confirm()` mounts a fresh instance of `Confirm` and returns a new promise, exactly like calling `toi(Confirm)` directly would.

## Default props

If `Confirm` needs props beyond `ref` and `resolve`, pass a second argument to `toi.fn` to set defaults used whenever the returned function is called without its own `props`. Try both buttons below — the first uses the default message, the second overrides it:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean> & { message: string }> = ({ ref, resolve, message }) => (
  <dialog ref={ref} open>
    <p>{message}</p>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

const confirm = toi.fn(Confirm, { message: 'Are you sure?' });

export default function App() {
  return (
    <>
      <button onClick={() => confirm()}>Delete (default message)</button>
      <button onClick={() => confirm({ message: 'Really?' })}>Delete (custom message)</button>
      <ToiHost />
    </>
  );
}
```

Passing `props` to a call merges it with `defaultProps` — keys in `props` take precedence, and any `defaultProps` keys it doesn't include are still used.

See [Additional Props](./additional-props) for how the required-versus-optional shape of `Props` affects whether an argument can be omitted at all.
