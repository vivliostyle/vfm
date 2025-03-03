# Contribution Guide

## Development Guide

```bash
git clone https://github.com/vivliostyle/vfm.git && cd vfm
npm install
npm run build
npm link
DEBUG=vfm vfm
```

After setup, run `npm run dev` to watch files.

## Commit Guide

### Comment

Please refer to [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716) for the commit comment.

## Release Guide (Maintainers only)

### Enter pre-release

```bash
release-it --preRelease=beta --npm.tag=next
```

### Bump pre-release version

```bash
npm run release:pre
# or
release-it --preRelease --npm.tag=next
```

### Graduate

```bash
npm run release
# or
release-it
```
