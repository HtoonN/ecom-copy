# Buyer feature

This folder is the ownership boundary for buyer-only work.

- `components/` contains the buyer account, storefront, and cart UI.
- `pages/` contains buyer page implementations.
- `server/` contains buyer API handlers.
- Files in `src/app/account` and `src/app/api/customer` are intentionally tiny route adapters. Keep buyer behavior here instead of adding it to those adapters.
- Reusable UI and infrastructure stay in `src/components` and `src/lib`. Changes there can affect buyer, seller, and admin experiences, so treat them as shared work.
- `UI/` contains buyer-scoped reusable primitives. Each primitive has its own component file and consumes the semantic variables imported from `ui-rule-kit/styles/ui-tokens.css` by `UI/styles.css`.
- `constants/` contains stable buyer options; localized labels are resolved while rendering.
- `locales/` contains all buyer-owned user-facing text. English is currently the only supported locale.
- The account `Style guide` tab is the live buyer primitive catalog, including APIs, states, and responsive examples.
- `tests/ui-contract.test.mjs` verifies the primitive inventory, token import, semantic-color discipline, locale keys, and style-guide coverage with Node's built-in test runner.

The database role remains `CUSTOMER` for compatibility; `buyer` is the code-ownership name.
