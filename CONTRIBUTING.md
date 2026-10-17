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

## remark 13 Migration (`packages-next/`)

The Markdown toolchain is being migrated from remark 8 / unified 9 to remark 13+. The umbrella issue is [#275](https://github.com/vivliostyle/vfm/issues/275). The Phase 0 survey, the migration policy, and the list of known breaking points are in [docs/dev/remark13-migration.md](./docs/dev/remark13-migration.md) (Japanese: [docs/ja/dev/remark13-migration.md](./docs/ja/dev/remark13-migration.md)). Every document under `docs/dev/` has a Japanese counterpart under `docs/ja/dev/`; keep both in sync when adding or changing one.

During the migration the repository holds two trees side by side:

| Directory | Packages | Status |
|---|---|---|
| `packages/` | `@vivliostyle/vfm`, `@vivliostyle/remark-ruby`, ... | Current. Published to npm. |
| `packages-next/` | `@vivliostyle/vfm-next`, `@vivliostyle/remark-ruby-next`, ... | Next generation. `"private": true`, never published. |

Rules for the co-existence period:

- Every package in `packages-next/` has the `-next` suffix in its `name`, and `workspace:*` dependencies and `import` statements between next packages use the suffixed names. This keeps pnpm `--filter` and `workspace:*` resolution unambiguous. The suffix is removed when next replaces current.
- Bug fixes for the released packages go to `packages/`. Migration work goes to `packages-next/`. Do not apply migration changes to `packages/`.
- `packages-next/` has no `CHANGELOG.md` and is excluded from changesets. Do not add changesets for next packages.
- `tools/vfm-compare` runs the same Markdown through both generations and reports the HTML differences (`pnpm --filter ./tools/vfm-compare compare`); see its README. Classify what it finds per [#293](https://github.com/vivliostyle/vfm/issues/293).
- Tests in `packages-next/` compare an MDAST dump next to the HTML. Regenerate the dump with the `mdast` script instead of editing it by hand; see the Tests section of [packages-next/README.md](./packages-next/README.md).
- `pnpm-workspace.yaml` carries `overrides` and `packageExtensions` that keep the `@types/unist` / `unified` / `vfile` type resolution of each tree on its own major. When you add a dependency to `packages-next/` that also exists in `packages/` at an older major, run `pnpm build` at the root to confirm both trees still compile. See breaking point 19 in [docs/dev/remark13-breaking-points.md](./docs/dev/remark13-breaking-points.md).
- `pnpm build` and `pnpm test` at the repository root run both trees. To work on one tree only:

```bash
pnpm --filter "./packages-next/*" build
pnpm --filter "./packages-next/*" test
pnpm --filter @vivliostyle/vfm-next dev
```

## Commit Guide

### Comment

Please refer to [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716) for the commit comment.

### Changeset

For each user-facing change, add a [changeset](https://github.com/changesets/changesets): run `pnpm changeset` and commit the generated `.changeset/*.md`.

## Release Guide (Maintainers only)

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm through [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers).

Pending changesets on `main` drive a "Version Packages" pull request. Merging it makes the workflow publish the changed packages to npm and create the matching git tags and GitHub Releases.
