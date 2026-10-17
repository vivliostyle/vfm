import { fromMarkdown } from 'mdast-util-from-markdown';
import type * as mdast from 'mdast';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, test } from 'vitest';
import {
  attributeFromMarkdown,
  attributeSyntax,
  mdast as attribute,
  type Options,
} from '../src/index.js';

/**
 * Parse Markdown to mdast with attribute support.
 * @param input - Markdown source.
 * @param options - Attribute options.
 * @returns Root.
 */
const parse = (input: string, options?: Options): mdast.Root =>
  fromMarkdown(input, {
    extensions: [attributeSyntax()],
    mdastExtensions: [attributeFromMarkdown(options)],
  });

/**
 * First child of the root with the given type.
 * @param tree - Root.
 * @param type - Node type.
 * @returns The node.
 */
const first = <T extends mdast.RootContent['type']>(
  tree: mdast.Root,
  type: T,
): Extract<mdast.RootContent, { type: T }> => {
  const node = tree.children.find((child) => child.type === type);
  if (!node) throw new Error(`expected child of type "${type}"`);
  return node as Extract<mdast.RootContent, { type: T }>;
};

/**
 * Render Markdown to HTML through remark-gfm and the attribute plugin.
 * @param input - Markdown source.
 * @param options - Attribute options (default: permissive scope).
 * @returns HTML.
 */
const render = (
  input: string,
  options: Options = { scope: 'permissive' },
): string =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(attribute, options)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(input),
  );

describe('inline', () => {
  test('attaches {.class} to strong and removes the list', () => {
    const p = first(parse('**bold**{.myclass}'), 'paragraph');
    expect(p.children).toHaveLength(1);
    expect(p.children[0]?.type).toBe('strong');
    expect(p.children[0]?.data?.hProperties).toEqual({ class: 'myclass' });
  });

  test('attaches {#id} to emphasis', () => {
    const p = first(parse('*em*{#myid}'), 'paragraph');
    expect(p.children[0]?.data?.hProperties).toEqual({ id: 'myid' });
  });

  test('attaches key=value to inline code', () => {
    const p = first(parse('`code`{style="color:red"}'), 'paragraph');
    expect(p.children[0]?.type).toBe('inlineCode');
    expect(p.children[0]?.data?.hProperties).toEqual({ style: 'color:red' });
  });

  test('attaches several attributes in source order', () => {
    const p = first(
      parse('**bold**{#id .class style="color:red"}'),
      'paragraph',
    );
    expect(p.children[0]?.data?.hProperties).toEqual({
      id: 'id',
      class: 'class',
      style: 'color:red',
    });
  });

  test('joins class shortcuts and merges with an id shortcut', () => {
    expect(render('*em*{#myid.cls1.cls2}')).toBe(
      '<p><em id="myid" class="cls1 cls2">em</em></p>',
    );
  });

  test('attaches to image, link and link reference', () => {
    expect(render('![alt](img.jpg){height=50}')).toBe(
      '<p><img src="img.jpg" alt="alt" height="50"></p>',
    );
    expect(render('[link](url){rel="external"}')).toBe(
      '<p><a href="url" rel="external">link</a></p>',
    );
    expect(
      render('[Google][google]{hreflang="en"}\n\n[google]: https://g.com'),
    ).toBe('<p><a href="https://g.com" hreflang="en">Google</a></p>');
  });

  test('attaches to delete and footnote reference (GFM)', () => {
    expect(render('~~gone~~{.x}')).toBe('<p><del class="x">gone</del></p>');
    expect(render('text[^1]{.note}\n\n[^1]: Note')).toContain('class="note"');
  });

  test('handles several lists in one paragraph', () => {
    expect(render('*a*{.x} and **b**{.y}')).toBe(
      '<p><em class="x">a</em> and <strong class="y">b</strong></p>',
    );
  });

  test('boolean and empty lists', () => {
    expect(render('**bold**{awesome}')).toBe(
      '<p><strong awesome="">bold</strong></p>',
    );
    expect(render('**bold**{}')).toBe('<p><strong>bold</strong></p>');
  });

  test('decodes character references in values', () => {
    expect(render('**bold**{title="a &amp; b"}')).toBe(
      '<p><strong title="a &#x26; b">bold</strong></p>',
    );
  });

  test('a list that follows text stays text, as written', () => {
    expect(render('This is {not, valid} text')).toBe(
      '<p>This is {not, valid} text</p>',
    );
    expect(render('{.class} some text')).toBe('<p>{.class} some text</p>');
    expect(render('word {key=value} word')).toBe(
      '<p>word {key=value} word</p>',
    );
  });

  test('a list separated from the target by a space stays text', () => {
    expect(render('**bold** {.class}')).toBe(
      '<p><strong>bold</strong> {.class}</p>',
    );
  });

  test('invalid lists stay text', () => {
    expect(render('**bold**{.class')).toBe(
      '<p><strong>bold</strong>{.class</p>',
    );
    expect(render('**bold**{=value}')).toBe(
      '<p><strong>bold</strong>{=value}</p>',
    );
    expect(render('**bold**{.class\n}')).toBe(
      '<p><strong>bold</strong>{.class\n}</p>',
    );
  });
});

describe('heading', () => {
  test('attaches a trailing list to the heading and trims the text', () => {
    const heading = first(parse('# Title {.class}'), 'heading');
    expect(heading.data?.hProperties).toEqual({ class: 'class' });
    expect(heading.children).toEqual([
      expect.objectContaining({ type: 'text', value: 'Title' }),
    ]);
  });

  test('works without a space before the list', () => {
    expect(render('# Title{.class}')).toBe('<h1 class="class">Title</h1>');
  });

  test('works when the heading ends with an inline element (#46)', () => {
    expect(render('# Heading *test* {#foo}')).toBe(
      '<h1 id="foo">Heading <em>test</em></h1>',
    );
    expect(render('## Heading <span>Test</span>  {#test lang=en}')).toBe(
      '<h2 id="test" lang="en">Heading <span>Test</span></h2>',
    );
  });

  test('works with closing hashes', () => {
    expect(render('## Title {.just-a-heading} ##')).toBe(
      '<h2 class="just-a-heading">Title</h2>',
    );
  });

  test('a heading that holds only a list keeps it as text', () => {
    const heading = first(parse('# {.class}'), 'heading');
    expect(heading.data).toBeUndefined();
    expect(render('# {.class}')).toBe('<h1>{.class}</h1>');
  });

  test('a list in the middle of a heading attaches to the inline before it', () => {
    expect(render('# A *b*{.x} c')).toBe('<h1>A <em class="x">b</em> c</h1>');
  });

  test('can be disabled', () => {
    expect(render('# Title {.class}', { enableAtxHeaderInline: false })).toBe(
      '<h1>Title {.class}</h1>',
    );
  });
});

describe('block', () => {
  test('attaches a list on the next line to a heading', () => {
    expect(render('# Title\n{.class}')).toBe('<h1 class="class">Title</h1>');
    expect(render('# Title\n{#myid}')).toBe('<h1 id="myid">Title</h1>');
    expect(render('Title\n=====\n{data-id="title"}')).toBe(
      '<h1 data-id="title">Title</h1>',
    );
  });

  test('attaches a list on the next line to fenced code', () => {
    const code = first(parse('```js\nx\n```\n{.highlight}'), 'code');
    expect(code.data?.hProperties).toEqual({ class: 'highlight' });
  });

  test('allows trailing whitespace', () => {
    expect(render('# Title\n{.class}   ')).toBe('<h1 class="class">Title</h1>');
  });

  test('does not attach across a blank line', () => {
    expect(render('# Title\n\n{.class}')).toBe(
      '<h1>Title</h1>\n<p>{.class}</p>',
    );
  });

  test('does not attach to a paragraph', () => {
    expect(render('text\n{.class}')).toBe('<p>text\n{.class}</p>');
    expect(render('text\n\n{.class}')).toBe('<p>text</p>\n<p>{.class}</p>');
  });

  test('a list with trailing text is not a block list', () => {
    expect(render('# Title\n{.class} extra')).toBe(
      '<h1>Title</h1>\n<p>{.class} extra</p>',
    );
  });

  test('can be disabled', () => {
    expect(render('# Title\n{.class}', { disableBlockElements: true })).toBe(
      '<h1>Title</h1>\n<p>{.class}</p>',
    );
  });
});

describe('scope', () => {
  test('extended (default) keeps global, aria-* and data-*, drops the rest', () => {
    expect(
      render('**bold**{style="color:red" onclick="evil()" custom="x"}', {}),
    ).toBe('<p><strong style="color:red">bold</strong></p>');
    expect(render('**bold**{aria-label="t" data-id="1"}', {})).toBe(
      '<p><strong aria-label="t" data-id="1">bold</strong></p>',
    );
    expect(render('![t](i.jpg){data--id=2}', {})).toBe(
      '<p><img src="i.jpg" alt="t"></p>',
    );
  });

  test('extended keeps element-specific attributes', () => {
    expect(render('![t](i.jpg){height=50}', {})).toBe(
      '<p><img src="i.jpg" alt="t" height="50"></p>',
    );
  });

  test('extend adds names per node type or for every type', () => {
    expect(
      render('![t](i.jpg){quality="80" awesomeness="max"}', {
        extend: { image: ['quality'] },
      }),
    ).toBe('<p><img src="i.jpg" alt="t" quality="80"></p>');
    expect(
      render('**b**{ex-attr="true"}', { extend: { '*': ['ex-attr'] } }),
    ).toBe('<p><strong ex-attr="true">b</strong></p>');
  });

  test('permissive keeps everything but DOM event handlers', () => {
    expect(render('**b**{custom="v" onclick="evil()"}')).toBe(
      '<p><strong custom="v">b</strong></p>',
    );
    expect(
      render('**b**{onclick="fn()"}', {
        scope: 'permissive',
        allowDangerousDOMEventHandlers: true,
      }),
    ).toBe('<p><strong onclick="fn()">b</strong></p>');
  });

  test('a list whose attributes are all filtered leaves no data', () => {
    const p = first(
      parse('**b**{onclick="evil()"}', { scope: 'permissive' }),
      'paragraph',
    );
    expect(p.children[0]?.data).toBeUndefined();
  });

  test('none drops everything', () => {
    expect(render('**b**{.x}', { scope: 'none' })).toBe(
      '<p><strong>b</strong></p>',
    );
  });
});

describe('fenced code info string', () => {
  test('is left to the consumer (meta is kept as written)', () => {
    const code = first(parse('```js title=app.js {#code-id}\nx\n```'), 'code');
    expect(code.lang).toBe('js');
    expect(code.meta).toBe('title=app.js {#code-id}');
    expect(code.data).toBeUndefined();
  });
});
