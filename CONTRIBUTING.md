# Contribution Guide

## Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage the Node.js and pnpm versions declared in `.mise.toml`.

### Install mise

- **macOS / Linux (Homebrew)**: `brew install mise`
- **macOS / Linux (script)**: `curl https://mise.run | sh`
- **Windows**: see the [official installation guide](https://mise.jdx.dev/installing-mise.html)

After installation, activate mise in your shell — for example by adding `eval "$(mise activate zsh)"` to `~/.zshrc`. See [Activate mise](https://mise.jdx.dev/getting-started.html#activate-mise) for other shells.

## Development Guide

```bash
git clone https://github.com/vivliostyle/vfm.git && cd vfm

# Install the Node.js and pnpm versions defined in .mise.toml
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

## Release Guide (Maintainers only)

Releases are driven by [release-it](https://github.com/release-it/release-it) from inside the `@vivliostyle/vfm` package.

### Enter pre-release

```bash
pnpm --filter @vivliostyle/vfm exec release-it --preRelease=beta --npm.tag=next
```

### Bump pre-release version

```bash
pnpm --filter @vivliostyle/vfm exec release-it --preRelease --npm.tag=next
```

### Graduate

```bash
pnpm --filter @vivliostyle/vfm exec release-it
```
