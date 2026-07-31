# Portable UI Rule Kit

This folder is a framework-neutral export of MatchDay's UI rules. Copy the
entire `ui-rule-kit` directory into a new project, then follow the adoption
steps below. The source application's runtime code is not required.

## What to copy

```text
ui-rule-kit/
|-- AGENTS.md                 # Instructions for AI/code contributors
|-- COPY_PASTE_PROMPT.md      # Ready-to-use prompt for a coding agent
|-- README.md                 # Adoption and verification guide
|-- docs/
|   |-- UI_RULES.md           # Delivery workflow and quality policy
|   `-- UI_TOKENS.md          # Human-readable visual specification
`-- styles/
    `-- ui-tokens.css         # Framework-neutral CSS custom properties
```

## Adopt in a new project

1. Copy `AGENTS.md`, `docs/`, and `styles/` to the new project's root.
2. Import `styles/ui-tokens.css` once in the application entry stylesheet.
3. In `AGENTS.md`, replace the path map with the new project's real paths.
4. Set the product font in `--ui-font-family`; keep the supplied fallback.
5. Build or map the minimum primitives listed in `docs/UI_RULES.md`.
6. Add a style-guide route or Storybook catalog for every reusable primitive.
7. Run the adoption checks below before feature work starts.

For an AI-assisted migration, paste the full instruction from
`COPY_PASTE_PROMPT.md` after copying this folder into the new project.

Example CSS import:

```css
@import "./styles/ui-tokens.css";
```

The kit does not require Tailwind, Vue, React, or a particular component
library. Utility classes may be used, but their values must resolve to the
tokens in `styles/ui-tokens.css`.

## Adoption checks

- Primary actions use brand red; secondary/edit/add actions use amber; neutral
  actions use grey. Interactive buttons are never blue.
- Inputs are white with a 1px border in every state, including disabled.
- Cards are white with a subtle grey border; state color is limited to small
  accents, icons, and text.
- Every async action prevents duplicate submission and exposes progress,
  success, and failure states.
- Every control has a visible keyboard focus state and an accessible name.
- New user-facing text is localized in every supported locale.
- Components have mobile and desktop examples with no horizontal overflow.
- The style guide documents props, events, normal, disabled, loading, error,
  and empty states where applicable.

## Canonical source and versioning

`docs/UI_TOKENS.md` defines intent and `styles/ui-tokens.css` defines the exact
values used by code. They must change together in one change set. Components
must not introduce a new repeated visual value without first adding a semantic
token.

This export intentionally uses the documented MatchDay primary red
`#f0100a`. Older component-local values such as `#e21515` are compatibility
values, not new-project tokens.
