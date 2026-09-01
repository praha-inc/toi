---
title: クイックスタート
description: toi をインストールし、ToiHost をマウントして、最初のコンポーネントを await する。
---

# クイックスタート

## インストール

```bash
npm install @praha/toi
```

## ホストをマウントする

`toi` がレンダリングするコンポーネントの置き場所を用意するため、コンポーネントツリーのどこかに一度だけ `ToiHost` をレンダリングします。

```tsx
import { ToiHost } from '@praha/toi';

const App = () => (
  <>
    <YourApp />
    <ToiHost />
  </>
);
```

## コンポーネントを await する

`toi` にコンポーネントを渡して呼び出すと、そのコンポーネントが `ToiHost` にマウントされます。返されたプロミスを `await` すると、コンポーネントが `resolve` に渡した値を受け取れます。

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
    <p>本当に削除しますか？</p>
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

トーストのように値を返す必要のないコンポーネントでは、`resolve` を引数なしで呼び出すこともできます。

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

基本的な使い方に必要な API は、これがすべてです。ライフサイクルの詳細については [ホストのマウント](../basic/mounting) や [解決する](../basic/resolving) を参照してください。
