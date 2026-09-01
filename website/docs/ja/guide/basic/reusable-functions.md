---
title: 再利用可能な関数
description: toi.fn を使ってコンポーネントを一度だけ toi に紐づけ、その関数を再利用する方法(デフォルト Props を含む)。
---

# 再利用可能な関数

確認が必要になるたびに `toi(Confirm)` を呼び出すこと自体は問題ありませんが、呼び出し箇所ごとに同じコンポーネントの参照を繰り返し書くのはミスの元になります。`toi.fn` はコンポーネントを一度だけ `toi` に紐づけ、必要な回数だけ呼び出せる関数を返します。

```tsx
const confirm = toi.fn(Confirm);
const confirmed = await confirm();
```

`confirm()` を呼び出すたびに、`Confirm` の新しいインスタンスがマウントされ、新しいプロミスが返されます。これは `toi(Confirm)` を直接呼び出す場合と全く同じです。

## デフォルト Props

`Confirm` が `ref` と `resolve` 以外の Props を必要とする場合、`toi.fn` の第2引数にデフォルト値を指定できます。これは、返された関数が独自の `props` なしで呼び出された場合に使用されます。下の2つのボタンを試してみてください。1つ目はデフォルトのメッセージを、2つ目はそれを上書きしたメッセージを使います。

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

呼び出し時に `props` を渡すと、`defaultProps` とマージされます。

`Props` が必須かオプションかによって、引数自体を省略できるかどうかが変わります。詳しくは [追加の Props](./additional-props) を参照してください。
