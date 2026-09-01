---
title: Guide
description: An overview of toi's guide — getting started, mounting the host, resolving, reusable functions, and additional props.
---

# Guide

toi is a tiny headless React utility for building imperative dialogs and toasts. Instead of wiring up state, portals, and conditional rendering by hand, you `await` a component and it resolves once the user (or your own code) is done with it.

## Getting Started

- [Introduction](./start/introduction) — the core idea behind toi and how the pieces fit together.
- [Quick Start](./start/quick) — install toi and mount your first component.

## Basics

- [Mounting the Host](./basic/mounting) — where `toi`-mounted components actually render.
- [Resolving](./basic/resolving) — resolving with or without a value, and how exit animations are handled.
- [Reusable Functions](./basic/reusable-functions) — binding a component to `toi` once with `toi.fn`.
- [Additional Props](./basic/additional-props) — passing props beyond `ref` and `resolve`.
