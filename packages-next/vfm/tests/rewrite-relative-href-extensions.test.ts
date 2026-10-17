import { stripIndent } from 'common-tags';
import { expect, test } from 'vitest';
import * as v from 'valibot';
import {
  readMetadata,
  RewriteRelativeHrefExtensionsOptionsSchema,
  VFM,
} from '../src/index.js';

test('exports RewriteRelativeHrefExtensionsOptionsSchema', () => {
  expect(
    v.parse(RewriteRelativeHrefExtensionsOptionsSchema, {
      rewriteRelativeHrefExtensions: true,
    }),
  ).toEqual({ rewriteRelativeHrefExtensions: true });
});

test('rewrites relative links configured through YAML frontmatter', () => {
  const input = stripIndent`
    ---
    vfm:
      partial: true
      rewriteRelativeHrefExtensions: true
    ---
    [sibling](./sibling.md)
  `;
  expect(
    String(
      VFM({ disableFormatHtml: true }, readMetadata(input)).processSync(input),
    ),
  ).toBe(`<p><a href="./sibling.html">sibling</a></p>`);
});

test('maps true to an md-to-html converter for the programmatic API', () => {
  expect(
    String(
      VFM({
        partial: true,
        disableFormatHtml: true,
        rewriteRelativeHrefExtensions: true,
      }).processSync(`[markdown](./sibling.md) [asciidoc](./sibling.adoc)`),
    ),
  ).toBe(
    `<p><a href="./sibling.html">markdown</a> <a href="./sibling.adoc">asciidoc</a></p>`,
  );
});

test('applies relative href filtering in the VFM converter', () => {
  expect(
    String(
      VFM({
        partial: true,
        disableFormatHtml: true,
        rewriteRelativeHrefExtensions: true,
      }).processSync(
        `[relative](./relative.md) [rooted](/rooted.md) [scheme](https://example.com/scheme.md) [authority](//example.com/authority.md)`,
      ),
    ),
  ).toBe(
    `<p><a href="./relative.html">relative</a> <a href="/rooted.md">rooted</a> <a href="https://example.com/scheme.md">scheme</a> <a href="//example.com/authority.md">authority</a></p>`,
  );
});

test('maps an extension list to an html converter', () => {
  const extensions = ['md', 'adoc'] as const;
  expect(
    String(
      VFM({
        partial: true,
        disableFormatHtml: true,
        rewriteRelativeHrefExtensions: extensions,
      }).processSync(`[markdown](./a.md) [asciidoc](./b.adoc)`),
    ),
  ).toBe(
    `<p><a href="./a.html">markdown</a> <a href="./b.html">asciidoc</a></p>`,
  );
});

test('maps an empty source extension to html for extensionless files', () => {
  expect(
    String(
      VFM({
        partial: true,
        disableFormatHtml: true,
        rewriteRelativeHrefExtensions: [''],
      }).processSync(
        `[plain](./chapter) [dotfile](./.chapter) [fragment](#part)`,
      ),
    ),
  ).toBe(
    `<p><a href="./chapter.html">plain</a> <a href="./.chapter.html">dotfile</a> <a href="#part">fragment</a></p>`,
  );
});
