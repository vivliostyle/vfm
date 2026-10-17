# packages-next

Next-generation VFM packages built on remark 13+ / unified 11. See [#275](https://github.com/vivliostyle/vfm/issues/275) for the migration plan and [CONTRIBUTING.md](../CONTRIBUTING.md) for the development rules during the co-existence period.

- Every package here is `"private": true` and carries the `-next` suffix in its name. Nothing in this directory is published.
- When the migration is complete, `packages/` becomes `packages-old/` and this directory becomes `packages/`.
