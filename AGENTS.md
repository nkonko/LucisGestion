# AGENTS.md

## Purpose

This file describes the repository structure, technology stack, workflow expectations, and installed agent skills for `LucisGestion`.

It helps contributors and automation agents understand:

- the project architecture;
- the main technologies in use;
- the recommended workflow for this repository;
- which skill should handle Angular-specific implementation questions;
- TFM delivery documentation expectations.

## Project Architecture

This repository is an Angular workspace built around a single application for artisanal bakery management.

Key directories:

- `src/app/` — application source code.
- `src/app/features/` — feature screens and feature-specific components.
- `src/app/shared/` — shared UI components, layout, pipes, and utilities.
- `src/app/core/` — core services, models, guards, stores, and app-wide utilities.
- `src/environments/` — runtime environment configuration.
- `read first/` — deployment and manual testing documentation.
- `docs/presentation/` — TFM slide deck source material.
- `docs/video/` — TFM video narration script.
- `public/images/landing/` — public visual assets used by the landing page and presentation material.

Important files:

- `angular.json` — workspace configuration.
- `package.json` — dependency and script definitions.
- `tsconfig.json` — TypeScript compiler settings.
- `src/main.ts` — application bootstrap.
- `src/index.html` — application shell.
- `firebase.json` — Firebase Hosting and deployment configuration.
- `firestore.rules` — Firestore security rules.
- `firestore.indexes.json` — Firestore index definitions.

## Technologies

This repository uses the following technology stack as declared in `package.json`:

- Angular `^22.0.x`.
- Firebase / AngularFire.
- NgRx Signals for reactive state support.
- Tailwind CSS v4.
- ESLint with `angular-eslint`.
- Vitest for unit testing.
- Playwright for screenshot and browser automation tooling.
- PNPM package manager.
- jsPDF, jsPDF AutoTable, and ExcelJS for report exports.

The repository is a private workspace and does not use Angular Material or CDK as shipped dependencies.

## Application Modes

- Firebase mode: `pnpm start` runs the real Firebase-backed application.
- Mock/demo mode: `pnpm start:mock` runs the application with in-memory data and no login requirement.
- Public demo: `https://lucis-gestion-6cea2.web.app/demo` is the preferred TFM evaluation path.

## Workflow

Primary commands:

- `pnpm install` — install dependencies.
- `pnpm start` — serve the Firebase-backed application locally.
- `pnpm start:mock` — serve the mock/demo application locally.
- `pnpm test` — run the unit test suite.
- `pnpm test:mock` — run mock-mode verification.
- `pnpm lint` — run lint checks.
- `pnpm build` — build the production application.
- `pnpm build:mock` — build the mock/demo configuration.
- `pnpm screenshot:mock` — capture a demo screenshot when Playwright browsers are installed.
- `pnpm release` — create a release package or deployment bundle.

Guidance for contributors:

- Focus on the existing `src/app/` structure and keep new code within the appropriate feature or shared area.
- Keep changes aligned with the repository architecture rather than introducing new application-wide patterns without review.
- Use `pnpm` for installs and scripts to stay consistent with the workspace.
- Keep TFM-facing documentation in English unless explicitly requested otherwise.
- When changing user-visible behavior, update `README.md`, the deployment guide, and the manual test cases when relevant.

## Don'ts

- No usar nombres de dos letras para inyecciones ni variables. Usa nombres descriptivos.
- No agregar comentarios inline. El código debe ser autoexplicativo.
- No tipar con `any`. Si se necesita un tipo, crearlo en `src/app/core/models/`.
- Do not introduce Angular Material or CDK unless the dependency decision is explicitly reviewed.

## Installed Skills

This workspace includes an Angular-focused skill path for implementation support.

- `angular-developer` — use this skill for Angular-specific development guidance and code generation. See `.agents/skills/angular-developer`.
