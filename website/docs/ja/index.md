---
pageType: home
titleSuffix: text
description: 命令的なダイアログ・トーストを構築するための小さなヘッドレス React ユーティリティ
head:
  - - meta
    - property: twitter:image
      content: https://praha-inc.github.io/toi/og-ja.png
  - - meta
    - property: og:image
      content: https://praha-inc.github.io/toi/og-ja.png
  - - meta
    - property: og:image:type
      content: image/png
  - - meta
    - property: og:image:width
      content: 1200
  - - meta
    - property: og:image:height
      content: 630

hero:
  name: toi
  text: 命令的なダイアログ・トーストを構築するための&nbsp;小さなヘッドレス&nbsp;React&nbsp;ユーティリティ
  tagline: state を組み立てる代わりに、コンポーネントを await するだけ
  actions:
    - theme: brand
      text: イントロダクション
      link: ./guide/start/introduction
    - theme: alt
      text: クイックスタート
      link: ./guide/start/quick

features:
  - title: Promise ベース
    details: '`await toi(Component)` は、コンポーネントが `resolve` に渡した値でそのまま解決されるため、命令的な処理の流れを上から下へ読めます。'
    icon: 🤝
  - title: ヘッドレス
    details: toi はコンポーネントのマウントとライフサイクルの追跡だけを行います。マークアップ・スタイル・アニメーションはすべてあなたに委ねられています。
    icon: 🎯
  - title: アニメーションを意識した設計
    details: 解決してもコンポーネントは終了アニメーションが終わるまでマウントされたままなので、ダイアログやトーストをきれいにアニメーションさせて閉じられます。
    icon: 🎬
---
