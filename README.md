# Vivliostyle Flavoured Markdown

Vivliostyle Flavored Markdown (VFM), a Markdown syntax specialized in book authoring. It is standardized and published for Vivliostyle and its sibling projects.

## Principles

1. Open discussion - steadily improving through open discussions and feedback from the vast community.
1. Provides reference implementation for parsing and converting VFM to HTML, allowing other non-Vivliostyle projects to use this syntax for their own purposes.

### VFM

1. Rule of least surprise
   - Should be lined and matched to another Markdown syntax.
1. **Not intended** to be a superset/subset of either CommonMark or GFM.
1. Backward compatible syntax (should not be incorrectly rendered in Markdown editor like Typora).

### HTML

- Follows [WCAG 2.1](https://www.w3.org/TR/WCAG21/).

## Spec

- [Discussion](https://github.com/vivliostyle/vfm/issues/1)
- [Working Draft](https://github.com/vivliostyle/vfm/blob/master/spec/vfm.md)

## Implementations [WIP]

- revive-parse - converts VFM string to `mdast`
- revive-rehype - converts `mdast` to `hast`
- revive-stringify - converts `hast` to HTML string
