
# AGENTS.md

## Purpose

This file describes the repository structure, technology stack, workflow expectations, and installed agent skills for `LucisGestion`.

It is not a development styleguide for Angular implementation details. Instead, it should help contributors and automation agents understand:

- the project architecture
- the main technologies in use
- the recommended workflow for this repository
- which skill should handle Angular-specific implementation questions
- optional sections that improve agent guidance

## Project Architecture

This repository is an Angular workspace built around a single application.

Key directories:

- `src/app/` — application source code
- `src/app/features/` — feature modules and feature-related components
- `src/app/shared/` — shared UI components, pipes, and utilities
- `src/app/core/` — core services, models, guards, and app-wide utilities
- `src/styles/` — design tokens, layout helpers, and reusable style utilities
- `src/environments/` — runtime environment configuration

Important files:

- `angular.json` — workspace configuration
- `package.json` — dependency and script definitions
- `tsconfig.json` — TypeScript compiler settings
- `src/main.ts` — app bootstrap
- `src/index.html` — application shell

## Technologies

This repository uses the following technology stack as declared in `package.json`:

- Angular `^21.2.x`
- Firebase / AngularFire
- NgRx Signals for reactive state support
- Tailwind CSS v4
- ESLint with `angular-eslint`
- Vitest for unit testing
- Playwright for browser automation and visual tests
- PNPM package manager

The repository is a private workspace and does not use Angular Material or CDK as part of the shipped dependencies.

## Workflow

Primary commands:

- `pnpm start` — serve the application locally
- `pnpm test` — run test suite
- `pnpm lint` — run lint checks
- `pnpm build` — build the application
- `pnpm release` — create a release package or deployment bundle

Guidance for contributors:

- Focus on the existing `src/app/` structure and keep new code within the appropriate feature or shared area.
- Keep changes aligned with the repository's architecture rather than introducing new application-wide patterns without review.
- Use `pnpm` for installs and scripts to stay consistent with the workspace.

## Installed Skills

This workspace includes an Angular-focused skill path for implementation support.

- `angular-developer` — use this skill for Angular-specific development guidance and code generation.[see](.agents/skills/angular-developer)
