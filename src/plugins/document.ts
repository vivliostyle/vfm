import { doctype } from 'doctype';
import { h, type Child } from 'hastscript';
import type { Node } from 'unist';
import { u } from 'unist-builder';
import { VFile } from 'vfile';
import type { Attribute, Metadata } from './metadata.js';

/**
 * Create AST properties from attributes.
 * @param attributes Attributes.
 * @returns Properties.
 */
const createProperties = (attributes?: Array<Attribute>): KeyValue => {
  if (!attributes) {
    return {};
  }

  const props: KeyValue = {};
  for (const attr of attributes) {
    props[attr.name] = attr.value;
  }

  return props;
};

/**
 * Create Markdown AST for `<head>`.
 * @param data Metadata.
 * @param vfile VFile.
 * @returns AST of `<head>`.
 */
const createHead = (data: Metadata, vfile: VFile): Child[] => {
  const head = [u('text', '\n'), h('meta', { charset: 'utf-8' })];

  // <title>...</title>
  {
    const title = typeof data.title === 'string' ? data.title : vfile.stem;
    if (typeof title === 'string') {
      head.push(u('text', '\n'), h('title', [title]));
    }
  }

  // <base>
  if (data.base) {
    const props = createProperties(data.base);
    head.push(u('text', '\n'), h('base', props));
  }

  // <meta>
  {
    // Add viewport of default
    const meta: Array<Array<Attribute>> = data.meta ? [...data.meta] : [];
    meta.unshift([
      { name: 'name', value: 'viewport' },
      { name: 'content', value: 'width=device-width, initial-scale=1' },
    ]);

    for (const attributes of meta) {
      const props = createProperties(attributes);
      head.push(u('text', '\n'), h('meta', props));
    }

    head.push(u('text', '\n'));
  }

  // <link>
  if (data.link) {
    for (const attributes of data.link) {
      const props = createProperties(attributes);
      head.push(u('text', '\n'), h('link', props));
    }

    head.push(u('text', '\n'));
  }

  // <script>
  if (data.script) {
    for (const attributes of data.script) {
      const props = createProperties(attributes);
      head.push(u('text', '\n'), h('script', props));
    }

    head.push(u('text', '\n'));
  }

  return head;
};

/**
 * Create Markdown AST for `<body>`.
 * @param metadata Metadata.
 * @param tree Tree of Markdown AST.
 * @returns AST of `<body>`.
 */
const createBody = (metadata: Metadata, tree: Node) => {
  // <body>...</body>
  const contents =
    tree.type === 'root' && Array.isArray((tree as any).children)
      ? (tree as any).children.concat()
      : [tree];
  if (0 < contents.length) {
    contents.unshift(u('text', '\n'));
  }

  contents.push(u('text', '\n'));

  const props = createProperties(metadata.body);

  // <body class="root-class body-class1 body-class2 ...">
  if (typeof metadata.class === 'string') {
    props.class = props.class
      ? `${metadata.class} ${props.class}`
      : metadata.class;
  }

  return h('body', props, contents);
};

/**
 * Create properties for `<html>`.
 * Sets the value defined for `html` in Frontmatter.
 * However, if `id`,` lang`, `dir`, and `class` are defined in the root, those are given priority.
 * @param metadata Metadata.
 * @param tree Tree of Markdown AST.
 * @param vfile VFile.
 * @returns AST of `<html>`.
 */
const createHTML = (metadata: Metadata, tree: Node, vfile: VFile) => {
  const props = createProperties(metadata.html);

  if (typeof metadata.id === 'string') {
    props.id = metadata.id;
  }

  if (typeof metadata.lang === 'string') {
    props.lang = metadata.lang;
  }

  if (typeof metadata.dir === 'string') {
    props.dir = metadata.dir;
  }

  // <html class="root-class html-class1 html-class2 ...">
  if (typeof metadata.class === 'string') {
    props.class = props.class
      ? `${metadata.class} ${props.class}`
      : metadata.class;
  }

  return h('html', props, [
    u('text', '\n'),
    {
      type: 'element' as const,
      tagName: 'head',
      properties: {},
      children: createHead(metadata, vfile) as import('hast').ElementContent[],
    },
    u('text', '\n'),
    createBody(metadata, tree),
    u('text', '\n'),
  ]);
};

/**
 * Process Markdown AST.
 * @param data Options.
 * @returns Transformer.
 */
export const mdast = (data: Metadata) => (tree: Node, vfile: VFile) => {
  return {
    type: 'root',
    children: [
      { type: 'doctype', name: doctype(5) },
      u('text', '\n'),
      createHTML(data, tree, vfile),
      u('text', '\n'),
    ],
  };
};
