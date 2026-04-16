# Foundry Project Writeup

## Overview

Foundry is an AI-powered app creation platform that turns natural language into live, usable micro apps.

The central idea is simple: if a user can clearly describe a small tool they need, they should be able to use that tool immediately instead of searching for a generic alternative or building it from scratch.

Foundry makes that possible by combining a native iOS shell, a live hosted app runtime, a central account and storage system, and Codex-driven generation for planning, building, editing, and deployment.

## Problem

People regularly need tiny, highly specific tools:

- a spending calculator for a personal rule
- a print layout tool for a one-off creative workflow
- a compact event utility
- a niche internal app for a team process

These are usually too small to justify traditional development, but too specific for the app store to already have the right solution.

This leaves users in an awkward middle ground where the need is real, but the path to software is too expensive, too slow, or too technical.

## Solution

Foundry turns micro-software into a direct product action.

Users enter a prompt, and Foundry:

1. interprets the task
2. structures the app
3. generates the experience with Codex
4. deploys it
5. places it back inside the same product shell

The result is not just a mockup or prototype. It is a live app the user can open, use, and continue refining.

## Product Design

The product is intentionally minimal.

It is organized into five tabs:

### Create

The primary action surface. Users describe the app they want, submit it, and watch the build progress flow until the app is ready.

### Apps

A personal workspace containing only the apps owned by the user. This keeps the product focused and avoids clutter.

### Guide

A built-in explanation of the product’s purpose, how it works, and how users should think about creating focused micro apps.

### Store

A curated set of polished starter apps that demonstrate what Foundry can produce and that users can add into their own workspace.

### Profile

Account, ownership, and session state.

## Featured Store Apps

To demonstrate the quality bar for micro apps inside Foundry, two complete showcase apps are included:

### Spend Hours

Spend Hours translates money into time.

Users configure:

- pay by year, month, or hour
- working hours per day
- working days per week
- work-time basis or life-time basis
- USD or INR

Then they enter a target price and Foundry immediately shows what that purchase means in real human time.

This app demonstrates how Foundry can create emotionally meaningful utilities, not just calculators.

### Polaroid Print

Polaroid Print is a creative workflow app for instant-film style output.

It includes:

- overview mode
- single photo mode
- multi-photo sheet mode
- realistic polaroid framing
- image styling effects
- A4 sheet layout logic
- PDF export for real printing

This app demonstrates that Foundry can generate not only data tools, but also rich creative utilities with concrete output artifacts.

## Codex Integration

Codex is core to Foundry’s architecture and product identity.

It is used for:

- feasibility interpretation
- app planning
- UI and workflow generation
- prompt-based editing
- deployment preparation
- iterative refinement

In Foundry, Codex is not treated as a passive assistant. It is the engine that transforms user intent into product behavior.

That is what makes Foundry feel fundamentally different from a conventional low-code tool or static template system.

## Technical Architecture

Foundry uses a hybrid architecture that supports both platform quality and instant launch:

- `SwiftUI` for the native iOS shell
- `Supabase` for authentication and app/platform data
- `Node backend` for orchestration and generation routing
- `Codex` for generation and edit workflows
- `Vercel` for hosted mobile-first app deployment

This structure enables:

- native-grade app shell UX
- live hosted app rendering
- shared identity across all micro apps
- immediate rollout without app store re-release for every generated app

## Why This Is Strong

Foundry is strong because it does not stop at “AI can write code.”

It answers the harder product question:

How should AI-generated software actually be delivered to users in a way that feels immediate, useful, elegant, and scalable?

The answer here is:

- one product shell
- one account system
- one place to create, save, edit, and launch
- AI as the builder
- deployment as part of the experience

## What Makes It Special

Foundry treats app creation as a first-class consumer interaction.

That shift has enormous implications:

- software becomes personal by default
- app stores become living inventories of remixable utilities
- prompt-based editing replaces long product backlog cycles
- the distance between need and usable software collapses

## Conclusion

Foundry demonstrates a future where software can be created as fluidly as content, but still delivered as a real product.

It is not just a builder.

It is a platform for turning intent into working apps.
