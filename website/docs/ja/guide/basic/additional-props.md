---
title: 追加の Props
description: ref と resolve 以外の Props をコンポーネントに渡す方法と、それらが必須かオプションかがどのように推論されるか。
---

# 追加の Props

`ToiProps<Response>` が持っているプロパティは `ref` と `resolve` だけです。実際のコンポーネントは表示するメッセージや削除対象のアイテムなど、その他のプロパティを必要とすることもあります。これらはコンポーネント自身の Props の一部として定義し、`toi` の第2引数を経由して渡します。

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

`toi` は `Confirm` 自身の Props の型から、レスポンスの型と追加の Props の両方を推論します。`toi` の呼び出し自体に何かを注釈する必要はありません。

## オプション or 必須

`toi`(または [`toi.fn`](./reusable-functions) が返す関数)の第2引数を省略できるかどうかは、追加の Props 自体から推論されます。すべての追加 Props がオプションであれば引数も省略可能に、いずれかが必須であれば引数も必須になります。

```tsx
type ConfirmProps = ToiProps<boolean> & { message?: string };

const Confirm: FC<ConfirmProps> = ({ ref, resolve, message = 'Are you sure?' }) => (/* ... */);

await toi(Confirm); // OK — `message` はオプション
await toi(Confirm, { message: 'Really?' }); // これも OK
```

```tsx
type ConfirmProps = ToiProps<boolean> & { message: string };

const Confirm: FC<ConfirmProps> = ({ ref, resolve, message }) => (/* ... */);

await toi(Confirm); // 型エラー — `message` は必須
await toi(Confirm, { message: 'Are you sure?' }); // 必須
```

## インラインコンポーネント

インラインで定義したコンポーネントを渡す場合、Props を推論することが出来ないため、`Response`(と、`ToiProps` 以外に必要なものがあれば `Props` も)を明示的に注釈してください。

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
