# Upstream attribution

Adapted from [stats-organization/github-stats-extended](https://github.com/stats-organization/github-stats-extended), fetched 2026-09-30.

- `packages/core/src/cards/repo.ts`, Git blob `d88687699e070193c07ee4dba40ee4ddfca5c15d`. Original retained as `repo.upstream.ts`.
- `packages/core/src/common/icons.ts`. Only repository, star and fork icons are retained in `icons.mjs`, including the GitHub/Octicons MIT notice.
- Upstream MIT license is preserved in `LICENSE`.

Our adapted renderer is `cards/render.mjs`. It retains the repo header, wrapped description, SVG language/star/fork presentation, and repository icons; removes the general-purpose option/translation/GraphQL dependencies; and adds fixed 400 × 152 layout, one row of GitHub topics, escaped text, local Hanken Grotesk fonts, and the profile color palette. It is not an unmodified copy or a fork of the complete upstream service.

Metadata comes from GitHub REST during local generation, not the hosted github-stats-extended endpoint. Font licenses are in `profile/fonts/`.
