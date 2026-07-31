# Shared UI primitives

This directory is the project-wide reusable UI boundary. Buyer, seller, and
admin features import primitives from `@/UI`; feature-specific behavior and
layout remain inside each feature.

The implementation follows `ui-rule-kit/docs/UI_RULES.md` and consumes the
semantic tokens in `ui-rule-kit/styles/ui-tokens.css`. Reuse or extend an
existing primitive before adding another one, and document reusable API changes
in the project style guide.
