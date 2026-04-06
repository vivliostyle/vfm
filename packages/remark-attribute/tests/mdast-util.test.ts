import assert from 'node:assert/strict';
import test from 'node:test';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type * as mdast from 'mdast';
import {
  attribute,
  attributeFromMarkdown,
  type Options,
} from '../src/index.ts';

/**
 * Parse markdown to mdast with attribute support.
 */
function parse(input: string, options?: Options) {
  return fromMarkdown(input, {
    extensions: [attribute()],
    mdastExtensions: [attributeFromMarkdown(options)],
  });
}

/**
 * Get the first child of given type from the tree.
 */
function first<T extends mdast.RootContent['type']>(
  tree: mdast.Root,
  type: T,
): Extract<mdast.RootContent, { type: T }> {
  for (const child of tree.children) {
    if (child.type === type)
      return child as Extract<mdast.RootContent, { type: T }>;
  }
  throw new Error(`expected child of type "${type}"`);
}

test.skip('mdast-util-attribute (public api)', async (t) => {
  await t.test('should export attributeFromMarkdown', async () => {
    assert.deepEqual(Object.keys(await import('../src/index.ts')).sort(), [
      'attributeFromMarkdown',
    ]);
  });
});

test('mdast-util-attribute (inline)', async (t) => {
  await t.test('should attach {.class} to strong', async () => {
    const tree = parse('**bold**{.myclass}');
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    assert.equal(strong.type, 'strong');
    assert.deepEqual(strong.data?.hProperties, { class: 'myclass' });
    // Attribute node should be removed
    assert.equal(p.children.length, 1);
  });

  await t.test('should attach {#id} to emphasis', async () => {
    const tree = parse('*em*{#myid}');
    const p = first(tree, 'paragraph');
    const em = p.children[0];
    if (!em) throw new Error('expected child');
    assert.equal(em.type, 'emphasis');
    assert.deepEqual(em.data?.hProperties, { id: 'myid' });
  });

  await t.test('should attach {key=value} to inlineCode', async () => {
    const tree = parse('`code`{style="color:red"}');
    const p = first(tree, 'paragraph');
    const code = p.children[0];
    if (!code) throw new Error('expected child');
    assert.equal(code.type, 'inlineCode');
    assert.deepEqual(code.data?.hProperties, { style: 'color:red' });
  });

  await t.test('should attach multiple attributes', async () => {
    const tree = parse('**bold**{#id .class style="color:red"}');
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    assert.deepEqual(strong.data?.hProperties, {
      id: 'id',
      class: 'class',
      style: 'color:red',
    });
  });

  await t.test('should attach to image', async () => {
    const tree = parse('![alt](img.jpg){height=50}', { scope: 'permissive' });
    const p = first(tree, 'paragraph');
    const img = p.children[0];
    if (!img) throw new Error('expected child');
    assert.equal(img.type, 'image');
    assert.deepEqual(img.data?.hProperties, { height: '50' });
  });

  await t.test('should attach to link', async () => {
    const tree = parse('[link](url){rel="external"}', { scope: 'permissive' });
    const p = first(tree, 'paragraph');
    const link = p.children[0];
    if (!link) throw new Error('expected child');
    assert.equal(link.type, 'link');
    assert.deepEqual(link.data?.hProperties, { rel: 'external' });
  });

  await t.test('should handle multiple inline attrs in paragraph', async () => {
    const tree = parse('*a*{.x} and **b**{.y}');
    const p = first(tree, 'paragraph');
    const em = p.children[0];
    if (!em) throw new Error('expected child');
    assert.equal(em.type, 'emphasis');
    assert.deepEqual(em.data?.hProperties, { class: 'x' });
    // Find the strong
    const strong = p.children.find((c) => c.type === 'strong');
    if (!strong) throw new Error('expected strong');
    assert.deepEqual(strong.data?.hProperties, { class: 'y' });
  });

  await t.test('should fallback unattached inline to text', async () => {
    const tree = parse('{.class} some text');
    const p = first(tree, 'paragraph');
    // The first child should be text (fallback)
    const child = p.children[0];
    if (!child || child.type !== 'text') throw new Error('expected text child');
    assert.ok(child.value.includes('.class'));
  });
});

test('mdast-util-attribute (heading inline)', async (t) => {
  await t.test('should attach inline attr to heading', async () => {
    const tree = parse('# Title {.class}');
    const heading = first(tree, 'heading');
    assert.deepEqual(heading.data?.hProperties, { class: 'class' });
    // Text should be trimmed
    const text = heading.children[0];
    if (!text || text.type !== 'text') throw new Error('expected text child');
    assert.equal(text.value, 'Title');
  });

  await t.test('should attach inline attr without space', async () => {
    const tree = parse('# Title{.class}');
    const heading = first(tree, 'heading');
    assert.deepEqual(heading.data?.hProperties, { class: 'class' });
  });

  await t.test('should not apply when heading only has attr', async () => {
    const tree = parse('# {.class}');
    const heading = first(tree, 'heading');
    // Should NOT have hProperties on the heading (fallback to text)
    assert.equal(heading.data, undefined);
  });
});

test('mdast-util-attribute (block)', async (t) => {
  await t.test('should attach block attr to preceding heading', async () => {
    const tree = parse('# Title\n{.class}');
    const heading = first(tree, 'heading');
    assert.deepEqual(heading.data?.hProperties, { class: 'class' });
    // Block attribute node should be removed
    assert.ok(!tree.children.find((c) => c.type === 'attributeBlock'));
  });

  await t.test('should attach {#id} block to heading', async () => {
    const tree = parse('# Title\n{#myid}');
    const heading = first(tree, 'heading');
    assert.deepEqual(heading.data?.hProperties, { id: 'myid' });
  });

  await t.test('should attach block attr to setext heading', async () => {
    const tree = parse('Title\n=====\n{.class}');
    const heading = first(tree, 'heading');
    assert.deepEqual(heading.data?.hProperties, { class: 'class' });
  });

  await t.test('should attach data-attr to heading', async () => {
    const tree = parse('# Title\n{data-id="title"}');
    const heading = first(tree, 'heading');
    assert.deepEqual(heading.data?.hProperties, { 'data-id': 'title' });
  });
});

test('mdast-util-attribute (fenced code meta)', async (t) => {
  await t.test('should keep bare meta as node.meta', async () => {
    const tree = parse('~~~lang info=string\ncode\n~~~', {
      scope: 'permissive',
    });
    const code = first(tree, 'code');
    assert.equal(code.lang, 'lang');
    assert.equal(code.meta, 'info=string');
    assert.equal(code.data?.hProperties, undefined);
  });

  await t.test('should parse braced attributes', async () => {
    const tree = parse('~~~lang {info=string}\ncode\n~~~', {
      scope: 'permissive',
    });
    const code = first(tree, 'code');
    assert.equal(code.lang, 'lang');
    assert.equal(code.meta, null);
    assert.deepEqual(code.data?.hProperties, { info: 'string' });
  });

  await t.test('should keep meta and parse trailing attributes', async () => {
    const tree = parse('~~~js title=app.js {#code-id}\ncode\n~~~', {
      scope: 'permissive',
    });
    const code = first(tree, 'code');
    assert.equal(code.lang, 'js');
    assert.equal(code.meta, 'title=app.js');
    assert.deepEqual(code.data?.hProperties, { id: 'code-id' });
  });
});

test('mdast-util-attribute (scope filtering)', async (t) => {
  await t.test('should filter with default scope (extended)', async () => {
    const tree = parse('**bold**{style="color:red" onclick="evil()"}');
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    // style is global, onclick is dangerous → filtered out
    assert.deepEqual(strong.data?.hProperties, { style: 'color:red' });
  });

  await t.test('should allow everything in permissive scope', async () => {
    const tree = parse('**bold**{style="color:red" custom="yes"}', {
      scope: 'permissive',
    });
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    assert.deepEqual(strong.data?.hProperties, {
      style: 'color:red',
      custom: 'yes',
    });
  });

  await t.test('should allow aria-* in global scope', async () => {
    const tree = parse('**bold**{aria-label="test"}');
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    assert.deepEqual(strong.data?.hProperties, { 'aria-label': 'test' });
  });

  await t.test('should allow data-* in global scope', async () => {
    const tree = parse('**bold**{data-id="123"}');
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    assert.deepEqual(strong.data?.hProperties, { 'data-id': '123' });
  });

  await t.test('should block DOM event handlers by default', async () => {
    const tree = parse('**bold**{onclick="evil()"}', { scope: 'permissive' });
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong) throw new Error('expected child');
    // permissive but allowDangerousDOMEventHandlers=false → all filtered out
    assert.equal(strong.data, undefined);
  });

  await t.test('should allow DOM handlers when opted in', async () => {
    const tree = parse('**bold**{onclick="fn()"}', {
      scope: 'permissive',
      allowDangerousDOMEventHandlers: true,
    });
    const p = first(tree, 'paragraph');
    const strong = p.children[0];
    if (!strong || strong.type !== 'strong') throw new Error('expected strong');
    assert.equal(strong.data?.hProperties?.onclick, 'fn()');
  });
});
