---
title: イントロダクション
description: toi とは何か、どんな課題を解決するのか、マウント・解決・終了アニメーションがどのように結びついているか。
---

# イントロダクション

確認ダイアログやトーストのように「ユーザーに何かを尋ねて、その結果を受けて処理を続ける」UI は、本質的に命令的です。イベントハンドラの中から呼び出して、その場で答えを受け取りたいものです。それを最も手軽に実現できるのが `window.confirm` ですが、`window.confirm` は本物のコンポーネントのように、スタイルを整えたり、アニメーションさせたり、アクセシブルにしたりすることができません。

自作のコンポーネントで同じような命令的な使い勝手を実現するには、通常「開いているかどうか」の state、「何を渡して呼び出されたか」の state、そして完了時にコンポーネントの内側からプロミスを解決する仕組みが必要になります。toi はそのパターンを 1 つの関数呼び出しにまとめたものです。

```tsx
const confirmed = await toi(Confirm);
```

## 仕組み

toi は 3 つの要素から構成されています。

- **`toi`** — コンポーネントをマウントし、プロミスを返します。イベントハンドラの中も含め、どこからでも呼び出せます。
- **`ToiHost`** — `toi` によって現在マウントされているすべてのコンポーネントをレンダリングします。ツリーのどこかに一度だけ存在させておく必要があります。
- **`ToiProps`** — `toi` に渡したコンポーネントへ toi が注入する `ref` と `resolve` の Props です。`resolve` を呼び出すことで、`toi` が返したプロミスが解決されます。

実際に試してみましょう。「Delete」→「OK」または「Cancel」の順にクリックすると、結果が表示されます。

```tsx preview="iframe-follow"
import { toi, ToiHost } from '@praha/toi';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type { FC } from 'react';

const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
  <dialog ref={ref} open>
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

`Confirm` は何の変哲もないただのコンポーネントです。context も、覚えるべき命令的な ref API もありません。唯一の要件は、`resolve` を受け取ること（そして必要であれば、アニメーション対象のルート要素に `ref` を渡すこと）だけです。

## ヘッドレスであること

toi 自体はマークアップやスタイル、アニメーションを一切レンダリングしません。`ToiHost` は、現在マウントされているコンポーネントをそのままレンダリングするだけです。`<dialog>` やボタン、トランジションなど、それ以外の部分はすべてあなたのコンポーネントに委ねられています。これにより、toi はどのデザインシステムやスタイリング手法とも組み合わせて使うことができます。

## 終了アニメーション

`resolve` を呼び出しても、コンポーネントはすぐにはアンマウントされません。toi はまず、`ref` に渡された要素上で実行中のアニメーションが完了するのを待ちます。これにより、フェードアウトやスライドアウトのようなトランジションを最後まで再生してから、コンポーネントが取り除かれ、プロミスが解決されます。詳細は [解決する](../basic/resolving) を参照してください。
