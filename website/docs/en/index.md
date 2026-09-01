---
pageType: home
titleSuffix: text
description: A tiny headless React utility for building imperative dialogs/toasts
head:
  - - meta
    - property: twitter:image
      content: https://praha-inc.github.io/toi/og-en.png
  - - meta
    - property: og:image
      content: https://praha-inc.github.io/toi/og-en.png
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
  text: A&nbsp;tiny headless React utility for building imperative dialogs/toasts
  tagline: Await a component instead of wiring up state for it
  actions:
    - theme: brand
      text: Introduction
      link: ./guide/start/introduction
    - theme: alt
      text: Quick Start
      link: ./guide/start/quick

features:
  - title: Promise-based
    details: '`await toi(Component)` resolves with whatever value your component passes to `resolve`, so imperative flows read top to bottom.'
    icon: 🤝
  - title: Headless
    details: toi only mounts your component and tracks its lifecycle — markup, styling, and animation stay entirely up to you.
    icon: 🎯
  - title: Animation aware
    details: Resolving keeps the component mounted until its exit animations finish, so dialogs and toasts can animate out cleanly.
    icon: 🎬
---
