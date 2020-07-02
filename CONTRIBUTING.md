# Contribution Guide

## Development Guide

```bash
git clone https://github.com/vivliostyle/vfm.git && cd vfm
yarn install
yarn build
yarn link
DEBUG=vfm vfm
```

After setup, run `yarn dev` to watch files.

## Release Guide (Maintainers only)

### Enter pre-release

```bash
release-it --preRelease=beta --npm.tag=next
```

### Bump pre-release version

```bash
yarn release:pre
# or
release-it --preRelease --npm.tag=next
```

### Graduate

```bash
yarn release
# or
release-it
```
