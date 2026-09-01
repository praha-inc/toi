---
title: ホストのマウント
description: ToiHost がなぜ必要なのか、toi でマウントしたコンポーネントが実際にどこにレンダリングされるのか、組み込みのアクセシビリティ対応について。
---

# ホストのマウント

`toi` はそれ自体では何もレンダリングしません。内部のストアにリクエストを登録し、それを誰かがレンダリングしてくれるのを待つだけです。`ToiHost` がその「誰か」であり、ストアを subscribe して、現在 `toi` によってマウントされているすべてのコンポーネントをレンダリングします。

```tsx
import { ToiHost } from '@praha/toi';

const App = () => (
  <>
    <YourApp />
    <ToiHost />
  </>
);
```

`ToiHost` は一度だけマウントする必要がありますが、場所はどこでも構いません。アプリ内のどこから `toi` を呼び出しても、同じホストにレンダリングされます。機能ごと・コンポーネント種別ごとにホストを用意する必要はありません。下の「Show toast」を何度かクリックすると、同じホストの中に複数のリクエストが積み重なり、それぞれ個別に閉じられる様子を確認できます。

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

## レンダリングされる内容

`ToiHost` は子要素を `aria-live="polite"` と `aria-label="notifications"` を持つ `<section>` でラップします。これにより、ダイアログやトーストがマウントされた際にスクリーンリーダーがそれをアナウンスできます。

```tsx
<section aria-live="polite" aria-label="notifications">
  {/* toi() の呼び出しごとに、リクエストされた順に 1 つずつ表示される */}
</section>
```

このラッパー以外に、`ToiHost` 自体はマークアップやスタイル、位置調整を一切追加しません。`toi` に渡す各コンポーネントが、自身の見た目(たとえば自分で中央寄せを管理する `<dialog>` や、CSS で自分の位置を決めるトースト)を担う責任を持ちます。

`ToiHost` がマウントされる前に `toi` が呼び出された場合、そのリクエストはストアにキューイングされるだけで、`ToiHost` がマウントされて現在のスナップショットを読み込んだ時点でレンダリングされます。
