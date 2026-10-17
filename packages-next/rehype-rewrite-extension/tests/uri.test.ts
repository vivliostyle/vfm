import { describe, expect, test } from 'vitest';
import type { ExtensionResolver } from '../src/index.js';
import { hrefOf, leaveUnchanged, markdownToHtml, runRewrite } from './utils.js';

describe('rewriteExtension: href rewriting spec', () => {
  describe('rewrites .md hrefs', () => {
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

  describe('rewrites independently of reference kind', () => {
    test('rooted path', () => {
      expect(hrefOf(runRewrite('/abs/file.md'))).toBe('/abs/file.html');
    });

    test('Windows path with forward slashes', () => {
      expect(hrefOf(runRewrite('C:/Users/foo/bar.md'))).toBe(
        'c:/Users/foo/bar.html',
      );
    });

    test('Windows path with backslashes', () => {
      expect(hrefOf(runRewrite('C:\\Users\\foo\\bar.md'))).toBe(
        'c:%5CUsers%5Cfoo%5Cbar.html',
      );
    });

    test('URL with a scheme and authority', () => {
      expect(hrefOf(runRewrite('https://example.com/foo.md'))).toBe(
        'https://example.com/foo.html',
      );
    });

    test('authority-relative URL', () => {
      expect(hrefOf(runRewrite('//example.com/foo.md'))).toBe(
        '//example.com/foo.html',
      );
    });

    test('URI with a scheme and no authority', () => {
      expect(hrefOf(runRewrite('custom:example.md'))).toBe(
        'custom:example.html',
      );
    });

    test('preserves URL components around the path', () => {
      expect(
        hrefOf(
          runRewrite('https://user@example.com:8443/chapter.md?draft=#section'),
        ),
      ).toBe('https://user@example.com:8443/chapter.html?draft=#section');
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
    test('when the URI has no path', () => {
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

    test('passes an empty extension when only a non-final segment has one', () => {
      let received: Parameters<ExtensionResolver>[0] | undefined;
      runRewrite('/dir.md/file', {
        resolveExtension: (parts) => {
          received = parts;
          return null;
        },
      });
      expect(received).toMatchObject({
        base: '/dir.md/file',
        extension: '',
      });
    });

    test('does not resolve an extension from a segment before a trailing slash', () => {
      let calls = 0;
      const resolveExtension: ExtensionResolver = () => {
        calls += 1;
        return 'html';
      };
      expect(hrefOf(runRewrite('./guide.md/', { resolveExtension }))).toBe(
        './guide.md/',
      );
      expect(hrefOf(runRewrite('./guide.md//', { resolveExtension }))).toBe(
        './guide.md//',
      );
      expect(calls).toBe(0);
    });

    test('passes an empty extension for dotfiles', () => {
      let received: Parameters<ExtensionResolver>[0] | undefined;
      runRewrite('./.md', {
        resolveExtension: (parts) => {
          received = parts;
          return null;
        },
      });
      expect(received).toMatchObject({ base: './.md', extension: '' });
    });

    test('does not call the resolver when the URI path is empty', () => {
      let calls = 0;
      const resolveExtension: ExtensionResolver = () => {
        calls += 1;
        return 'html';
      };
      expect(hrefOf(runRewrite('#section', { resolveExtension }))).toBe(
        '#section',
      );
      expect(hrefOf(runRewrite('', { resolveExtension }))).toBe('');
      expect(calls).toBe(0);
    });
  });

  describe('opt-out behaviour', () => {
    test('is a no-op when the converter returns null', () => {
      expect(
        hrefOf(
          runRewrite('./sibling.md', { resolveExtension: leaveUnchanged }),
        ),
      ).toBe('./sibling.md');
    });
  });

  describe('custom extension converters', () => {
    test('passes an empty extension for a path without an extension', () => {
      let received: Parameters<ExtensionResolver>[0] | undefined;
      const tree = runRewrite('1', {
        resolveExtension: (parts) => {
          received = parts;
          return 'html';
        },
      });
      expect(received).toMatchObject({ base: '1', extension: '' });
      expect(hrefOf(tree)).toBe('1.html');
    });

    test('uses the destination returned by the converter', () => {
      expect(
        hrefOf(
          runRewrite('./sibling.md', {
            resolveExtension: ({ extension }) =>
              extension === 'md' ? 'xhtml' : null,
          }),
        ),
      ).toBe('./sibling.xhtml');
    });

    test('passes URI components and parsed extension parts to the converter', () => {
      let received: Parameters<ExtensionResolver>[0] | undefined;
      const resolveExtension: ExtensionResolver = (parts) => {
        received = parts;
        return 'html';
      };
      runRewrite('https://example.com/chapter/sibling.md?draft=#section', {
        resolveExtension,
      });
      expect(received).toEqual({
        scheme: 'https',
        userinfo: undefined,
        host: 'example.com',
        port: undefined,
        path: '/chapter/sibling.md',
        query: 'draft=',
        fragment: 'section',
        reference: 'uri',
        base: '/chapter/sibling',
        extension: 'md',
      });
    });

    test('rewrites only source extensions handled by the converter', () => {
      const resolveExtension: ExtensionResolver = ({ extension }) =>
        extension === 'adoc' ? 'html' : null;
      expect(hrefOf(runRewrite('./sibling.adoc', { resolveExtension }))).toBe(
        './sibling.html',
      );
      expect(hrefOf(runRewrite('./sibling.md', { resolveExtension }))).toBe(
        './sibling.md',
      );
    });

    test('rewrites multiple source extensions', () => {
      const resolveExtension: ExtensionResolver = ({ extension }) =>
        ['md', 'adoc', 're'].includes(extension) ? 'html' : null;
      expect(hrefOf(runRewrite('./a.md', { resolveExtension }))).toBe(
        './a.html',
      );
      expect(hrefOf(runRewrite('./b.adoc', { resolveExtension }))).toBe(
        './b.html',
      );
      expect(hrefOf(runRewrite('./c.re', { resolveExtension }))).toBe(
        './c.html',
      );
      expect(hrefOf(runRewrite('./d.txt', { resolveExtension }))).toBe(
        './d.txt',
      );
    });

    test('extension matching is restricted to the trailing segment', () => {
      expect(
        hrefOf(
          runRewrite('./a.md.backup', {
            resolveExtension: markdownToHtml,
          }),
        ),
      ).toBe('./a.md.backup');
    });

    test('passes the source extension without a leading dot', () => {
      const resolveExtension: ExtensionResolver = ({ extension }) =>
        extension === 'md' ? 'html' : null;
      expect(hrefOf(runRewrite('./sibling.md', { resolveExtension }))).toBe(
        './sibling.html',
      );
    });
  });
});
