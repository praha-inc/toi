---
title: ページ遷移で閉じる
description: toi がマウントしたコンポーネントがページ遷移をまたいで開いたままになる理由と、currententrychange イベントや @praha/react-kit を使って遷移時に閉じる方法について。
---

# ページ遷移で閉じる

別のページへ遷移しても、未回答のリクエストが自動的に確定することはありません。`toi` がレンダリングするコンポーネントは `ToiHost` の中にあり、`ToiHost` は通常ルーティングの対象外の場所に置かれるため（[ホストのマウント](./mounting)を参照）、ページ遷移をまたいでもマウントされたままになります。あるページで開いた確認ダイアログは、ユーザーが次のページへ移動した後もそこに残ります。

それが望ましいかどうかはコンポーネント次第です。保存完了を知らせるトーストであれば、表示のきっかけになったページより長く生き残っても問題ないでしょう。一方、前のページの内容に紐づいた確認ダイアログは残っていては困るのが普通で、`reject()` を呼び出して閉じるべきです。これは[解決する](./resolving#拒否する)で説明した「リクエストが放棄された」ケースにあたります。

ユーザーがページを離れたときにコンポーネントを閉じたい場合は、Navigation API の [`currententrychange`](https://developer.mozilla.org/docs/Web/API/Navigation/currententrychange_event) イベントを監視してください。現在の履歴エントリが変わった後に発火するイベントなので、そこから `reject()` を呼び出します。

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

[`@praha/react-kit`](https://github.com/praha-inc/react-kit) の `useNavigationEventListener` フックを使うと、これをより簡潔に書けます。コンポーネントのライフタイムにわたって購読し、再購読なしに常に最新の `listener` を呼び出します。

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
