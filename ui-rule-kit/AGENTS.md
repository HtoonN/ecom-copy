# UI System Instructions

These rules apply to every contributor and AI agent working on UI in this
project. Replace the path map once during project setup; do not weaken the
rules per feature.

## Required read order

Before any UI change, read:

1. This file.
2. `docs/UI_RULES.md`.
3. `docs/UI_TOKENS.md`.
4. The reusable UI catalog and target feature files.

If a one-off request conflicts with the system, preserve the system and make
the smallest compatible change. Record a deliberate exception in the change
description.

## Project path map

Adapt these paths to the new project's structure:

- Reusable primitives: `src/UI/`
- Feature components: `src/components/`
- Views/routes: `src/views/`
- Shared constants: `src/constants/`
- Locales: `src/locales/`
- Style guide: `src/views/StyleguideView.*`
- Token CSS: `styles/ui-tokens.css`

## Mandatory reuse gate

Before creating a component:

1. Search the reusable primitives.
2. Reuse an existing primitive when it satisfies the need.
3. Otherwise extend the closest primitive with a backward-compatible API.
4. Create a new primitive only when reuse and extension are not feasible.

## Non-negotiable policy

- Keep reusable styling in primitives and feature behavior in feature
  components. Views orchestrate data, routing, and page state.
- Never hardcode user-facing copy when localization exists.
- Never ship an async action without loading and duplicate-action protection.
- Always provide explicit success, failure, warning, and validation feedback.
- Never use blue for buttons or button-like controls.
- Inputs stay white with a 1px border, including disabled inputs.
- Cards stay white with a subtle grey border; use small accents for state.
- Keyboard access, visible focus, semantic markup, and accessible names are
  required, not optional polish.
- New reusable UI must be responsive and documented in the style guide in the
  same change set.

## Required delivery order

1. Reuse or extend the primitive layer.
2. Compose feature behavior.
3. Wire view/store/route behavior.
4. Update the style guide with usage, API, and states.
5. Update every supported locale.
6. Centralize repeated options/configuration in shared constants.
7. Verify tokens, accessibility, responsive behavior, and tests.

## Definition of done

A UI change is complete only when:

- reuse-first review is complete;
- mobile and desktop layouts are stable;
- keyboard navigation and focus are verified;
- loading prevents repeated submission;
- success/failure/validation feedback is explicit;
- all supported locales contain the new copy;
- saved data is synchronized so the UI cannot revert to stale state;
- reusable API changes appear in the style guide; and
- relevant automated checks and the production build pass.

