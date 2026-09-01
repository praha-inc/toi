# toi

[![npm version](https://badge.fury.io/js/@praha%2Ftoi.svg)](https://www.npmjs.com/package/@praha/toi)
[![npm download](https://img.shields.io/npm/dm/@praha/toi.svg)](https://www.npmjs.com/package/@praha/toi)
[![license](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/praha-inc/toi/blob/main/LICENSE)
[![Github](https://img.shields.io/github/followers/praha-inc?label=Follow&logo=github&style=social)](https://github.com/orgs/praha-inc/followers)

A tiny headless React utility for building imperative dialogs/toasts.

```tsx
const confirmed = await toi(Confirm);
```

This repository is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

## 📦 Packages

| Package | Description |
| --- | --- |
| [`@praha/toi`](./packages/toi) | The library published to npm. See its [README](./packages/toi/README.md) for installation and usage. |
| [`website`](./website) | The documentation site built with [Rspress](https://rspress.rs/), deployed to [praha-inc.github.io/toi](https://praha-inc.github.io/toi). |

## 🛠 Development

### Prerequisites

- Node.js (the version is pinned in [`.tool-versions`](./.tool-versions))
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
```

### Commands

Run these from the repository root. Each command runs the corresponding task in every workspace package via Turborepo.

```bash
pnpm run build      # Build all packages
pnpm run test       # Run tests
pnpm run lint:code  # Lint with oxlint
pnpm run lint:type  # Type-check with tsc
```

To run a task in a single package, use pnpm's `--filter` option.

```bash
pnpm --filter @praha/toi run test
pnpm --filter @praha/toi-website run dev
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome.

Feel free to check [issues page](https://github.com/praha-inc/toi/issues) if you want to contribute.

## 📝 License

Copyright © [PrAha, Inc.](https://www.praha-inc.com/)

This project is [```MIT```](https://github.com/praha-inc/toi/blob/main/LICENSE) licensed.
