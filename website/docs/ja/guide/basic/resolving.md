---
title: 解決する
description: 値の有無による resolve の違い、reject による拒否、resolve や reject を複数回呼び出した場合の挙動、終了アニメーションによるアンマウントの遅延について。
---

# 解決する

`toi` がマウントするすべてのコンポーネントは、`ToiResolve<Response>` 型の `resolve` プロパティを受け取ります。これを呼び出すと、`toi` が返したプロミスが、渡した値で解決されます。

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

## 拒否する

すべてのコンポーネントは `resolve` に加えて、`ToiReject` 型の `reject` プロパティも受け取ります。これを呼び出すと、`toi` が返したプロミスは拒否（reject）され、`await` は値を返す代わりに例外を投げます。

`reject` は、コンポーネントがもう回答を返せなくなった場合のためのものです。ユーザーがダイアログを閉じたといった通常の結果に使うものではありません。典型的なケースは次の 2 つです。

- **resolve する前の処理が失敗した。** フォームの送信やアイテムの削除など、resolve の前に何らかの処理を行うダイアログは、その処理が失敗すると返すべき回答がありません。発生したエラーを `reject` に渡して、呼び出し側へ届けます。
- **リクエストが放棄された。** ユーザーが別のページへ移動した、回答される前にコンポーネントが破棄された、といった場合です。引数なしで `reject()` を呼び出します。

```tsx
const Confirm: FC<ToiProps<boolean>> = ({ ref, resolve, reject }) => (
  <dialog ref={ref} open>
    <button onClick={() => resolve(false)}>Cancel</button>
    <button
      onClick={async () => {
        try {
          await deleteItem();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }}
    >
      Delete
    </button>
  </dialog>
);

try {
  const deleted = await toi(Confirm);
  // 削除に成功した（true）か、Cancel がクリックされた（false）
} catch (error) {
  // deleteItem() が失敗した
}
```

`reject` は `Promise.reject` と同じく、任意の理由（reason）を受け取ります。引数なしで呼び出した場合、プロミスは `AbortError` という名前の `DOMException` で拒否されます。これは `AbortSignal` と同じ慣習なので、呼び出し側は `error.name === 'AbortError'` によって、放棄されたリクエストと本当の失敗を見分けられます。

確認ダイアログの「Cancel」ボタンやトーストを閉じる操作のように、呼び出し側が想定して処理する通常の結果には、上の `Confirm` と同じく値を渡して（あるいは値なしで）`resolve` してください。正常系のコードを `try`/`catch` で囲む必要がなくなり、拒否を本当に問題が起きた場合だけに限定できます。

なお、処理されなかった拒否はコンソールにエラーとして表示されます。拒否される可能性のあるコンポーネントを `await` するコードでは、必ず例外を捕捉してください。

## resolve や reject を複数回呼び出す

`resolve` や `reject` を 2 回以上呼び出しても、2 回目以降は何も起こりません。どちらであっても最初の呼び出しが優先され、その時点でプロミスはすでに確定処理を開始しています。そのため、ボタンのクリックと背景（バックドロップ）のクリックのように、複数のイベントに紐づけても、二重発火を自分でガードする必要はありません。

## 終了アニメーション

`resolve`（または `reject`）を呼び出しても、コンポーネントはすぐにはアンマウントされません。toi は `ref` に渡された要素（[`Animatable`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations) インターフェースを実装している必要があります）を見て、その要素または子孫要素上で実行中のアニメーション（無限に繰り返すものを除く）がすべて終わるのを待ってから、コンポーネントを `ToiHost` から取り除き、プロミスを解決します。

これにより、`resolve` と同時に開始した CSS や Web Animations の終了トランジションを、最後まで再生させることができます。下の「Dismiss」をクリックして、フェードアウトが終わってからトーストが消えるのを確認してみてください。

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
      <div ref={ref} className={closing ? 'toast--closing' : undefined}>
        <p>Saved!</p>
        <button
          onClick={() => {
            setClosing(true);
            resolve();
          }}
        >
          Dismiss
        </button>
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

「Dismiss」をクリックすると、フェードアウトアニメーションを開始するクラスを追加し、同じハンドラの中で `resolve` を呼び出しています。toi はそのアニメーションが終わるまでトーストをアンマウントしないため、`animationend` を自分で監視しなくても、コンポーネント（とプロミス）は終了トランジションにかかる時間だけ生き続けます。

`ref` が一度も要素にアタッチされなかった場合や、その要素に実行中のアニメーションがない場合は、`resolve` は次のアニメーションフレームでプロミスを解決します。
