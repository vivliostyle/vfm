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

## Commit Guide

### Comment

Please refer to [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716) for the commit comment.
