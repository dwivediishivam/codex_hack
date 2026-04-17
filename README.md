# Foundry

Foundry is an AI-native platform for creating micro apps on demand.

Instead of searching endlessly for a tool that almost fits, users describe what they need in plain language and Foundry turns that request into a usable app inside a single product shell. The result is a system where custom software can be made, edited, deployed, and used in minutes.

Built as an iOS-first product, Foundry combines a native Swift shell with a live mobile web runtime so that newly created apps can be launched immediately without waiting for app store release cycles. For the live demo, the same product experience is also available as a mobile-focused web app.

## What Foundry Does

Foundry lets users:

- create a new app from a prompt
- save polished apps from the store into their own workspace
- edit apps with follow-up instructions
- manage personal app collections in one account
- launch hosted apps instantly from the same shell

The product is designed for exactly the kinds of small, focused tools people repeatedly wish existed:

- personal finance helpers
- creative print tools
- event utilities
- internal one-purpose workflows
- niche productivity utilities

## Why It Matters

There is a massive gap between “I need a tiny tool for this” and “I’m going to build and ship software for it.”

Most existing software is either:

- too large
- too generic
- too slow to customize
- too expensive to justify for a small use case

Foundry closes that gap. It turns software creation into a direct user action, not a multi-week product cycle.

## Core Product Experience

Foundry is organized into five simple product surfaces:

1. `Create`
   Write what you want. Foundry plans the app, generates it, deploys it, and tracks build progress.

2. `Apps`
   Your personal collection. This tab only shows apps you created or explicitly added for yourself.

3. `Guide`
   A clear explanation of what Foundry is, how it works, and how to get the best results from it.

4. `Store`
   A curated library of polished micro apps that users can open immediately or add into their own workspace.

5. `Profile`
   Account identity, session state, and app ownership.

## Featured Apps

### Spend Hours

Spend Hours reframes purchases in terms of time instead of price.

Users can set compensation by:

- year
- month
- hour

And then choose whether they want to calculate cost using:

- working hours
- life hours

The result is a much more human way to evaluate spending. Instead of just seeing a number, users see what a purchase means in terms of actual time.

### Polaroid Print

Polaroid Print turns photos into print-ready instant-film style outputs.

It supports:

- single-photo preview mode
- multiple-photo batch mode
- realistic polaroid framing
- styled image treatment
- A4 print sheet generation
- export to PDF for real printing

This app demonstrates the kind of focused, high-utility creative workflow that Foundry is designed to make possible on demand.

## How Foundry Uses Codex

Foundry is connected directly to Codex for live app creation and evolution.

When a user submits a prompt:

1. Foundry sends the request to its backend orchestration layer.
2. Codex evaluates the request and plans the app structure.
3. Codex generates the app logic, UX structure, and deployment-ready artifact.
4. Foundry deploys the result automatically.
5. The new app appears back inside the user’s workspace.

The same flow also powers prompt-based updates. Users do not just generate apps once; they continue shaping them by describing changes in plain language.

In other words, Codex is not just assisting development behind the scenes. It is part of the runtime product experience.

## Architecture

Foundry is built as a hybrid platform:

- `SwiftUI` native shell for the iOS app
- `Supabase` for authentication and platform data
- `Render` backend API for generation jobs, generated app storage, and hosted micro-app runtime pages
- `Emergent` or `Vercel` frontend hosting for the web shell
- `Codex` as the generation and build agent

This architecture gives Foundry the best of both worlds:

- native product experience for the platform shell
- immediate deployment for generated apps
- a shared account system across every micro app
- continuous prompt-driven iteration

## Live Demo

The primary product is the iOS application.

For live judging and easy access, the same application shell has been reproduced as a mobile-focused web app:

- `https://pocket-founder.vercel.app`

Open it on a phone-sized screen for the intended experience.

## Repository Structure

- `codex_hack/`
  The SwiftUI iOS application
- `web/`
  The mobile-focused frontend shell, deployable independently on Emergent or Vercel
- `backend/`
  The standalone API for app creation, generation state, generated app retrieval, and hosted utility app execution

## Deployment

Deployment is intentionally straightforward and split by surface:

- iOS shell via Xcode / TestFlight flow
- mobile web shell via Emergent or Vercel
- backend via a Node host such as Render or Railway
- auth and data via Supabase

Environment configuration can be handled in the respective platform env files and Xcode build settings.

See `DEPLOYMENT.md` for the current split-host setup and required environment variables.

## Vision

Foundry is a step toward software that is created at the moment of need.

Not every problem needs a full startup, a full SaaS product, or a full engineering cycle.

Sometimes someone just needs the right app, right now.

Foundry is built for that moment.
