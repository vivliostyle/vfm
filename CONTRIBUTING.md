# Contribution Guide

## Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage the Node.js and pnpm versions declared in `mise.toml`. See the [mise installation guide](https://mise.jdx.dev/installing-mise.html) and [Activate mise](https://mise.jdx.dev/getting-started.html#activate-mise) for setup.

## Development Guide

```bash
git clone https://github.com/vivliostyle/vfm.git && cd vfm

# Install the Node.js and pnpm versions defined in mise.toml
mise install

# Install dependencies for all workspace packages
pnpm install

# Build every package in the workspace
pnpm build

# Expose the CLI on your PATH for local testing
cd packages/vfm
pnpm link --global
DEBUG=vfm vfm
```

To watch sources during development:

```bash
pnpm --filter @vivliostyle/vfm dev
```

To run the test suite across the workspace:

```bash
pnpm test
```

## remark 13 Migration

The Markdown toolchain is being migrated from remark 8 / unified 9 to remark 13+. The umbrella issue is [#275](https://github.com/vivliostyle/vfm/issues/275). The Phase 0 survey, the migration policy, and the list of known breaking points are in [docs/dev/remark13-migration.md](./docs/dev/remark13-migration.md) (Japanese: [docs/ja/dev/remark13-migration.md](./docs/ja/dev/remark13-migration.md)). Every document under `docs/dev/` has a Japanese counterpart under `docs/ja/dev/`; keep both in sync when adding or changing one.

## Commit Guide

### Comment

Please refer to [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716) for the commit comment.

### Changeset

For each user-facing change, add a [changeset](https://github.com/changesets/changesets): run `pnpm changeset` and commit the generated `.changeset/*.md`.

## Release Guide (Maintainers only)

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm through [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers).

Pending changesets on `main` drive a "Version Packages" pull request. Merging it makes the workflow publish the changed packages to npm and create the matching git tags and GitHub Releases.
