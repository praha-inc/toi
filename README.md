# @praha/toi

[![npm version](https://badge.fury.io/js/@praha%2Ftoi.svg)](https://www.npmjs.com/package/@praha/toi)
[![npm download](https://img.shields.io/npm/dm/@praha/toi.svg)](https://www.npmjs.com/package/@praha/toi)
[![license](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/praha-inc/toi/blob/main/LICENSE)
[![Github](https://img.shields.io/github/followers/praha-inc?label=Follow&logo=github&style=social)](https://github.com/orgs/praha-inc/followers)

## 👏 Getting Started

### Installation

```bash
npm install @praha/toi
```

### Usage

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

Call `toi` with a component to mount it into the `ToiHost` and await the value passed to its `resolve` prop.

```tsx
import { toi } from '@praha/toi';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

const confirmed = await toi(Confirm);
```

`resolve` can also be called with no argument for components that don't need to resolve with a value, such as toasts.

```tsx
const Toast: FC<ToiProps> = ({ ref, resolve }) => (
  <div ref={ref} onAnimationEnd={() => resolve()}>
    Saved!
  </div>
);

await toi(Toast);
```

Once `resolve` is called, the component stays mounted until any running animations (excluding infinite ones) on the element attached to `ref` finish, so exit animations can play out before it's removed from the `ToiHost` and the promise resolves.

Use `toi.fn` to bind a component to `toi` once and reuse the resulting function.

```tsx
const confirm = toi.fn(Confirm);
const confirmed = await confirm();
```

Pass a second argument to `toi` for components that need additional props beyond `resolve` and `ref`.

```tsx
type ConfirmProps = ToiProps<boolean> & { message: string };

const Confirm: FC<ConfirmProps> = ({ ref, resolve, message }) => (
  <dialog ref={ref} open>
    <p>{message}</p>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

const confirmed = await toi(Confirm, { message: 'Are you sure?' });
```

`toi.fn`'s second argument works the same way, but as *default* props: they're used whenever the returned function is called without its own `props` argument, and can be overridden per call by passing `props` anyway.

```tsx
const confirm = toi.fn(Confirm, { message: 'Are you sure?' });

const confirmed = await confirm(); // uses the default message: 'Are you sure?'
const confirmedAgain = await confirm({ message: 'Really?' }); // overrides it
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome.

Feel free to check [issues page](https://github.com/praha-inc/toi/issues) if you want to contribute.

## 📝 License

Copyright © [PrAha, Inc.](https://www.praha-inc.com/)

This project is [```MIT```](https://github.com/praha-inc/toi/blob/main/LICENSE) licensed.
