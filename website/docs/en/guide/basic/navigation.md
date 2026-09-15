---
title: Closing on Navigation
description: Why components mounted by toi stay open across page transitions, and how to close them on navigation with the currententrychange event or @praha/react-kit.
---

# Closing on Navigation

Navigating to another page doesn't settle a pending request on its own. Components rendered by `toi` live in `ToiHost`, which usually sits outside the routed part of your tree (see [Mounting the Host](./mounting)), so they stay mounted across page transitions — a confirm dialog opened on one page is still there after the user moves to the next.

Whether that's what you want depends on the component. A toast announcing a saved item can reasonably outlive the page it was triggered from. A confirm dialog tied to something on the previous page usually can't, and should be closed by calling `reject()` — the abandoned-request case described in [Resolving](./resolving#rejecting).

To close a component when the user navigates away, listen for the Navigation API's [`currententrychange`](https://developer.mozilla.org/docs/Web/API/Navigation/currententrychange_event) event, which fires after the current history entry has changed, and call `reject()` from it:

```tsx
import { useEffect } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve, reject }) => {
  useEffect(() => {
    const abandon = () => reject();
    navigation.addEventListener('currententrychange', abandon);
    return () => navigation.removeEventListener('currententrychange', abandon);
  }, [reject]);

  return (
    <dialog ref={ref} open>
      <button onClick={() => resolve(true)}>OK</button>
      <button onClick={() => resolve(false)}>Cancel</button>
    </dialog>
  );
};
```

The `useNavigationEventListener` hook from [`@praha/react-kit`](https://github.com/praha-inc/react-kit) wraps this up more concisely. It subscribes for the lifetime of the component and always calls the latest `listener` without re-subscribing:

```tsx
import { useNavigationEventListener } from '@praha/react-kit';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve, reject }) => {
  useNavigationEventListener({
    type: 'currententrychange',
    listener: () => reject(),
  });

  return (
    <dialog ref={ref} open>
      <button onClick={() => resolve(true)}>OK</button>
      <button onClick={() => resolve(false)}>Cancel</button>
    </dialog>
  );
};
```
