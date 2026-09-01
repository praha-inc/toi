---
title: 解決する
description: 値の有無による resolve の違い、resolve を複数回呼び出した場合の挙動、終了アニメーションによるアンマウントの遅延について。
---

# 解決する

`toi` がマウントするすべてのコンポーネントは、`ToiResolve<Response>` 型を持つ `resolve` プロップを受け取ります。これを呼び出すと、渡した値で `toi` が返したプロミスが解決されます。

```tsx
const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
    <button onClick={() => resolve(true)}>OK</button>
    <button onClick={() => resolve(false)}>Cancel</button>
  </dialog>
);

const confirmed = await toi(Confirm);
```

## 値なしで解決する

`Response` はデフォルトで `void` になるため、閉じられるだけのトーストのように何かを報告する必要のないコンポーネントは、引数なしで `resolve()` を呼び出せます。

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

## resolve を複数回呼び出す

`resolve` を 2 回目以降呼び出しても効果はありません。最初の呼び出しが優先され、プロミスはすでに解決処理を開始しています。そのため、ボタンのクリックと背景(バックドロップ)のクリックのように、複数のイベントに `resolve` を紐づけても、二重発火を自分でガードする必要はありません。

## 終了アニメーション

`resolve` を呼び出しても、コンポーネントはすぐにはアンマウントされません。toi は `ref` に渡された要素([`Animatable`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations) インターフェースを実装している必要があります)を見て、その要素または子要素上で実行中のアニメーション(無限に繰り返すものを除く)がすべて終わるのを待ってから、コンポーネントを `ToiHost` から取り除き、プロミスを解決します。

これにより、`resolve` によってトリガーされた CSS や Web Animations の終了トランジションを、最後まで再生させることができます。下の「Dismiss」をクリックして、フェードアウトが終わってからトーストが消えるのを確認してみてください。

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Toast: FC<ToiProps> = ({ ref, resolve }) => {
  const [closing, setClosing] = useState(false);

  return (
    <>
      <style>{`
        @keyframes toast-fade-out {
          to { opacity: 0; }
        }
        .toast--closing {
          animation: toast-fade-out 600ms ease-out forwards;
        }
      `}</style>
      <div
        ref={ref}
        className={closing ? 'toast--closing' : undefined}
        onAnimationEnd={() => { if (closing) resolve(); }}
      >
        <p>Saved!</p>
        <button onClick={() => setClosing(true)}>Dismiss</button>
      </div>
    </>
  );
};

export default function App() {
  return (
    <>
      <button onClick={() => toi(Toast)}>Save</button>
      <ToiHost />
    </>
  );
}
```

「Dismiss」をクリックするとフェードアウトアニメーションを開始するクラスが追加されます。`resolve` は、そのアニメーションの `animationend` が発火するまで呼び出されないため、コンポーネント(とプロミス)は終了トランジションにかかる時間だけ生き続けます。

`ref` が一度も要素にアタッチされなかった場合や、その要素に実行中のアニメーションがない場合は、`resolve` は次のアニメーションフレームでプロミスを解決します。
