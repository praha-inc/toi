---
title: Additional Props
description: Passing a component props beyond ref and resolve, and how the required-versus-optional shape of those props is inferred.
---

# Additional Props

`ToiProps<Response>` only describes `ref` and `resolve`. A component almost always needs more than that — a message to display, an item to confirm deletion of, and so on. Define those as part of the component's own props, then pass them as a second argument to `toi`:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

type ConfirmProps = ToiProps<boolean> & { message: string };

const Confirm: FC<ConfirmProps> = ({ ref, resolve, message }) => (
  <dialog ref={ref} open>
    <p>{message}</p>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

export default function App() {
  return (
    <>
      <button onClick={() => toi(Confirm, { message: 'Are you sure?' })}>
        Delete
      </button>
      <ToiHost />
    </>
  );
}
```

`toi` infers both the response type and the extra props from `Confirm`'s own props type — there's nothing to annotate on the call to `toi` itself.

## Optional vs. required

Whether the second argument to `toi` (or to a function returned by [`toi.fn`](./reusable-functions)) can be omitted is inferred from the extra props themselves: if every extra prop is optional, the argument is too; if any is required, the argument is required.

```tsx
type ConfirmProps = ToiProps<boolean> & { message?: string };

const Confirm: FC<ConfirmProps> = ({ ref, resolve, message = 'Are you sure?' }) => (/* ... */);

await toi(Confirm); // fine — `message` is optional
await toi(Confirm, { message: 'Really?' }); // also fine
```

```tsx
type ConfirmProps = ToiProps<boolean> & { message: string };

const Confirm: FC<ConfirmProps> = ({ ref, resolve, message }) => (/* ... */);

await toi(Confirm); // type error — `message` is required
await toi(Confirm, { message: 'Are you sure?' }); // required
```

## Inline components

When passing a component defined inline, its props usually can't be inferred well enough on their own — annotate `Response` (and `Props`, if it needs anything beyond `ToiProps`) explicitly:

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';

import type { ToiProps } from '@praha/toi';

type ConfirmProps = ToiProps<boolean> & { message: string };

export default function App() {
  return (
    <>
      <button
        onClick={() => toi<boolean, ConfirmProps>(({ ref, resolve, message }) => (
          <dialog ref={ref} open>
            <p>{message}</p>
            <button onClick={() => resolve(true)}>OK</button>
            <button onClick={() => resolve(false)}>Cancel</button>
          </dialog>
        ), { message: 'Are you sure?' })}
      >
        Delete
      </button>
      <ToiHost />
    </>
  );
}
```
