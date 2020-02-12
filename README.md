# Vivliostyle Flavored Markdown

Vivliostyle Flavored Markdown (VFM), a Markdown syntax optimized for book authoring. It is standardized and published for Vivliostyle and its sibling projects.

## Principles

1. Open discussion - steadily improving through open discussion and feedback from the vast community.
1. Provides reference implementation for parsing and converting VFM to HTML, allowing other non-Vivliostyle projects to use this syntax for their own purposes.

### VFM

1. Rule of least surprise
   1. Should be lined and matched to another Markdown syntax.
   1. Minimize incompatible syntax.
1. Based on CommonMark specifications.
   1. Not necessary to inherit all syntax from CommonMark.
   1. Choose according to its needs, not for historical reasons.

### HTML

- Should follows [DPUB-ARIA](https://www.w3.org/TR/dpub-aria/) and [WCAG 2.1](https://www.w3.org/TR/WCAG21/).

## Spec

- [Discussion](https://github.com/vivliostyle/vfm/issues/1)
- [Working Draft](https://github.com/vivliostyle/vfm/blob/master/spec/vfm.md)

## Implementations [WIP]

- revive-parse - converts VFM string to `mdast`
- revive-rehype - converts `mdast` to `hast`
- revive-stringify - converts `hast` to HTML string
