import { stripIndent } from 'common-tags';
import { describe, expect, test } from 'vitest';
import type * as unist from 'unist';
import * as v from 'valibot';
import { readMetadata, VFM } from '../src/index.js';
import {
  RewriteLocalHrefExtensionsOptionsSchema,
  rewriteLocalHrefExtensions,
} from '../src/plugins/rewrite-local-href-extensions.js';

// The boolean toggle must flow from YAML frontmatter (`vfm:` key) into
// the rewrite without being repeated in programmatic options.
test('E2E (YAML frontmatter): rewriteLocalHrefExtensions flows from `vfm:` into the rewrite', () => {
  const input = stripIndent`
    ---
    vfm:
      partial: true
      rewriteLocalHrefExtensions: true
    ---
    [sibling](./sibling.md)
  `;
  expect(
    String(
      VFM({ disableFormatHtml: true }, readMetadata(input)).processSync(input),
    ),
  ).toBe(`<p><a href="./sibling.html">sibling</a></p>`);
});

test('E2E: relative *.md link is rewritten to *.html through the full pipeline', () => {
  expect(
    String(
      VFM({
        partial: true,
        disableFormatHtml: true,
        rewriteLocalHrefExtensions: true,
      }).processSync(`[sibling](./sibling.md)`),
    ),
  ).toBe(`<p><a href="./sibling.html">sibling</a></p>`);
});

describe('RewriteLocalHrefExtensionsOptionsSchema', () => {
  test('accepts an empty object (option is optional)', () => {
    expect(v.parse(RewriteLocalHrefExtensionsOptionsSchema, {})).toEqual({});
  });

  test('accepts rewriteLocalHrefExtensions: true', () => {
    expect(
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: true,
      }),
    ).toEqual({ rewriteLocalHrefExtensions: true });
  });

  test('accepts rewriteLocalHrefExtensions: false', () => {
    expect(
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: false,
      }),
    ).toEqual({ rewriteLocalHrefExtensions: false });
  });

  test('accepts an empty extension array', () => {
    expect(
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: [],
      }),
    ).toEqual({ rewriteLocalHrefExtensions: [] });
  });

  test('accepts a single-element extension array', () => {
    expect(
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: ['md'],
      }),
    ).toEqual({ rewriteLocalHrefExtensions: ['md'] });
  });

  test('accepts a multi-element extension array', () => {
    expect(
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: ['md', 'adoc'],
      }),
    ).toEqual({ rewriteLocalHrefExtensions: ['md', 'adoc'] });
  });

  test('rejects scalar non-boolean values', () => {
    expect(() =>
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: 'yes',
      }),
    ).toThrow();
  });

  test('rejects arrays with non-string elements', () => {
    expect(() =>
      v.parse(RewriteLocalHrefExtensionsOptionsSchema, {
        rewriteLocalHrefExtensions: ['md', 1],
      }),
    ).toThrow();
  });
});

describe('rewriteLocalHrefExtensions plugin shape', () => {
  test('always returns a transformer function (enabled)', () => {
    expect(
      typeof rewriteLocalHrefExtensions({
        rewriteLocalHrefExtensions: true,
      }),
    ).toBe('function');
  });

  test('always returns a transformer function (disabled by default)', () => {
    expect(typeof rewriteLocalHrefExtensions()).toBe('function');
  });

  test('disabled transformer is a no-op on the tree', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: './sibling.md' },
          children: [{ type: 'text', value: 'link' }],
        },
      ],
    } as unist.Node;
    rewriteLocalHrefExtensions()(tree);
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: './sibling.md' },
          children: [{ type: 'text', value: 'link' }],
        },
      ],
    });
  });
});

// Behavioural specification for the rewrite logic. Each case isolates a
// requirement that the rewrite accepts every HTML-valid href shape (bare
// path, fragment, query string, percent-encoded path, combinations
// thereof) and rewrites only the `.md` tail. Remote URLs (http(s),
// protocol-relative, mailto:, tel:, …) are always left untouched.

type AnchorTree = {
  type: 'root';
  children: [
    {
      type: 'element';
      tagName: 'a';
      properties: { href: string };
      children: [{ type: 'text'; value: string }];
    },
  ];
};

const treeWithHref = (href: string): AnchorTree => ({
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'a',
      properties: { href },
      children: [{ type: 'text', value: 'link' }],
    },
  ],
});

const hrefOf = (tree: AnchorTree): string => tree.children[0].properties.href;

const runRewrite = (
  href: string,
  { extensions = true }: { extensions?: boolean | readonly string[] } = {},
): AnchorTree => {
  const tree = treeWithHref(href);
  rewriteLocalHrefExtensions({
    rewriteLocalHrefExtensions: extensions,
  })(tree as unknown as unist.Node);
  return tree;
};

describe('rewriteLocalHrefExtensions: href rewriting spec', () => {
  describe('rewrites relative .md hrefs', () => {
    test('bare relative path (./sibling.md)', () => {
      expect(hrefOf(runRewrite('./sibling.md'))).toBe('./sibling.html');
    });

    test('relative path without leading ./ (sibling.md)', () => {
      expect(hrefOf(runRewrite('sibling.md'))).toBe('sibling.html');
    });

    test('parent-directory traversal (../sibling.md)', () => {
      expect(hrefOf(runRewrite('../sibling.md'))).toBe('../sibling.html');
    });

    test('nested relative path (./sub/sibling.md)', () => {
      expect(hrefOf(runRewrite('./sub/sibling.md'))).toBe('./sub/sibling.html');
    });

    test('rewrites only the trailing .md, not intermediate ".md" segments', () => {
      expect(hrefOf(runRewrite('./a.md.backup.md'))).toBe('./a.md.backup.html');
    });
  });

  // Absolute paths inherently couple the document to a machine-local
  // file system and cannot be expected to work under Vivliostyle CLI.
  // POSIX-style absolute paths (`/abs/...`) happen to be rewritten
  // because excluding them would require an extra branch; Windows-style
  // absolute paths (`C:/...` or `C:\...`, regardless of separator) are
  // not supported because adding the branch needed to detect them is
  // not justified for a non-portable form. The cases below pin both
  // ends of this deliberate asymmetry.
  describe('absolute paths (machine-local; non-portable)', () => {
    test('POSIX abs path is rewritten', () => {
      expect(hrefOf(runRewrite('/abs/file.md'))).toBe('/abs/file.html');
    });

    test('Windows abs path with forward slashes is NOT rewritten (failure by design)', () => {
      expect(hrefOf(runRewrite('C:/Users/foo/bar.md'))).toBe(
        'C:/Users/foo/bar.md',
      );
    });

    test('Windows abs path with backslashes is NOT rewritten (failure by design)', () => {
      expect(hrefOf(runRewrite('C:\\Users\\foo\\bar.md'))).toBe(
        'C:\\Users\\foo\\bar.md',
      );
    });
  });

  describe('preserves HTML-valid href tail components', () => {
    test('fragment (./sibling.md#section)', () => {
      expect(hrefOf(runRewrite('./sibling.md#section'))).toBe(
        './sibling.html#section',
      );
    });

    test('empty fragment (./sibling.md#)', () => {
      expect(hrefOf(runRewrite('./sibling.md#'))).toBe('./sibling.html#');
    });

    test('query string (./sibling.md?v=1)', () => {
      expect(hrefOf(runRewrite('./sibling.md?v=1'))).toBe('./sibling.html?v=1');
    });

    test('empty query (./sibling.md?)', () => {
      expect(hrefOf(runRewrite('./sibling.md?'))).toBe('./sibling.html?');
    });

    test('multi-value query (./sibling.md?a=1&b=2)', () => {
      expect(hrefOf(runRewrite('./sibling.md?a=1&b=2'))).toBe(
        './sibling.html?a=1&b=2',
      );
    });

    test('query + fragment (./sibling.md?v=1#section)', () => {
      expect(hrefOf(runRewrite('./sibling.md?v=1#section'))).toBe(
        './sibling.html?v=1#section',
      );
    });

    test('fragment containing ? (./sibling.md#a?b)', () => {
      expect(hrefOf(runRewrite('./sibling.md#a?b'))).toBe('./sibling.html#a?b');
    });

    test('percent-encoded path (./my%20file.md)', () => {
      expect(hrefOf(runRewrite('./my%20file.md'))).toBe('./my%20file.html');
    });

    test('percent-encoded path with fragment + query', () => {
      expect(hrefOf(runRewrite('./my%20file.md?q=1#s'))).toBe(
        './my%20file.html?q=1#s',
      );
    });
  });

  describe('leaves the href unchanged', () => {
    test('for absolute http(s) URLs', () => {
      expect(hrefOf(runRewrite('https://example.com/foo.md'))).toBe(
        'https://example.com/foo.md',
      );
    });

    test('for protocol-relative URLs (//host/foo.md)', () => {
      expect(hrefOf(runRewrite('//example.com/foo.md'))).toBe(
        '//example.com/foo.md',
      );
    });

    test('for mailto: URLs', () => {
      expect(hrefOf(runRewrite('mailto:foo@example.com'))).toBe(
        'mailto:foo@example.com',
      );
    });

    test('for tel: URLs', () => {
      expect(hrefOf(runRewrite('tel:+1234567890'))).toBe('tel:+1234567890');
    });

    test('for non-.md relative paths (.html, .txt)', () => {
      expect(hrefOf(runRewrite('./sibling.html'))).toBe('./sibling.html');
      expect(hrefOf(runRewrite('./notes.txt'))).toBe('./notes.txt');
    });

    test('for non-.md rooted paths (.html, .txt)', () => {
      expect(hrefOf(runRewrite('/abs/sibling.html'))).toBe('/abs/sibling.html');
      expect(hrefOf(runRewrite('/abs/notes.txt'))).toBe('/abs/notes.txt');
    });

    test('for pure fragment-only hrefs (#section)', () => {
      expect(hrefOf(runRewrite('#section'))).toBe('#section');
    });

    test('for empty href', () => {
      expect(hrefOf(runRewrite(''))).toBe('');
    });
  });

  describe('opt-out behaviour', () => {
    test('is a no-op when rewriteLocalHrefExtensions is false (default)', () => {
      expect(hrefOf(runRewrite('./sibling.md', { extensions: false }))).toBe(
        './sibling.md',
      );
    });

    test('is a no-op for an empty extension array', () => {
      expect(hrefOf(runRewrite('./sibling.md', { extensions: [] }))).toBe(
        './sibling.md',
      );
    });
  });

  describe('custom extension lists', () => {
    test('`true` is shorthand for `["md"]`', () => {
      expect(hrefOf(runRewrite('./sibling.md', { extensions: true }))).toBe(
        './sibling.html',
      );
      expect(hrefOf(runRewrite('./sibling.md', { extensions: ['md'] }))).toBe(
        './sibling.html',
      );
    });

    test('rewrites only listed extensions (.adoc list ignores .md)', () => {
      expect(
        hrefOf(runRewrite('./sibling.adoc', { extensions: ['adoc'] })),
      ).toBe('./sibling.html');
      expect(hrefOf(runRewrite('./sibling.md', { extensions: ['adoc'] }))).toBe(
        './sibling.md',
      );
    });

    test('rewrites every listed extension when multiple are given', () => {
      const list = ['md', 'adoc', 're'] as const;
      expect(hrefOf(runRewrite('./a.md', { extensions: list }))).toBe(
        './a.html',
      );
      expect(hrefOf(runRewrite('./b.adoc', { extensions: list }))).toBe(
        './b.html',
      );
      expect(hrefOf(runRewrite('./c.re', { extensions: list }))).toBe(
        './c.html',
      );
      // anything not listed survives
      expect(hrefOf(runRewrite('./d.txt', { extensions: list }))).toBe(
        './d.txt',
      );
    });

    test('extension matching is restricted to the trailing segment', () => {
      // `a.md.backup` ends with `.backup`, not `.md`, so it must not be
      // rewritten when the option lists only `md`.
      expect(hrefOf(runRewrite('./a.md.backup', { extensions: ['md'] }))).toBe(
        './a.md.backup',
      );
    });

    test('leading dots in the option entries are tolerated', () => {
      expect(hrefOf(runRewrite('./sibling.md', { extensions: ['.md'] }))).toBe(
        './sibling.html',
      );
    });
  });
});
