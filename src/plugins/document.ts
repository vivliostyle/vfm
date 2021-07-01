import doctype from 'doctype';
import h from 'hastscript';
import { Node } from 'unist';
import { VFile } from 'vfile';
import { Attribute, Metadata } from './metadata';

/** Key/Value pair. */
type KeyValue = { [key: string]: any };

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
const createHead = (data: Metadata, vfile: VFile) => {
  const head = [{ type: 'text', value: '\n' }, h('meta', { charset: 'utf-8' })];

  // <title>...</title>
  {
    const title = typeof data.title === 'string' ? data.title : vfile.stem;
    if (typeof title === 'string') {
      head.push({ type: 'text', value: '\n' }, h('title', [title]));
    }
  }

  // <base>
  if (data.base) {
    const props = createProperties(data.base);
    head.push({ type: 'text', value: '\n' }, h('base', props));
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
      head.push({ type: 'text', value: '\n' }, h('meta', props));
    }

    head.push({ type: 'text', value: '\n' });
  }

  // <link>
  if (data.link) {
    for (const attributes of data.link) {
      const props = createProperties(attributes);
      head.push({ type: 'text', value: '\n' }, h('link', props));
    }

    head.push({ type: 'text', value: '\n' });
  }

  // <script>
  if (data.script) {
    for (const attributes of data.script) {
      const props = createProperties(attributes);
      head.push({ type: 'text', value: '\n' }, h('script', props));
    }

    head.push({ type: 'text', value: '\n' });
  }

  return head;
};

/**
 * Create Markdown AST for `<body>`.
 * @param data Metadata.
 * @param tree Tree of Markdown AST.
 * @returns AST of `<body>`.
 */
const createBody = (data: Metadata, tree: Node) => {
  // <body>...</body>
  const contents =
    tree.type === 'root' && Array.isArray(tree.children)
      ? tree.children.concat()
      : [tree];
  if (0 < contents.length) {
    contents.unshift({ type: 'text', value: '\n' });
  }

  contents.push({ type: 'text', value: '\n' });

  const props = createProperties(data.body);
  return h('body', props, contents);
};

/**
 * Create properties for `<html>`.
 * Sets the value defined for `html` in Frontmatter.
 * However, if `id`,` lang`, `dir`, and `class` are defined in the root, those are given priority.
 * @param data Metadata.
 * @param tree Tree of Markdown AST.
 * @param vfile VFile.
 * @returns AST of `<html>`.
 */
const createHTML = (data: Metadata, tree: Node, vfile: VFile) => {
  const props = createProperties(data.html);

  if (typeof data.id === 'string') {
    props.id = data.id;
  }

  if (typeof data.lang === 'string') {
    props.lang = data.lang;
  }

  if (typeof data.dir === 'string') {
    props.dir = data.dir;
  }

  if (typeof data.class === 'string') {
    props.class = data.class;
  }

  return h('html', props, [
    { type: 'text', value: '\n' },
    h('head', createHead(data, vfile)),
    { type: 'text', value: '\n' },
    createBody(data, tree),
    { type: 'text', value: '\n' },
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
      { type: 'text', value: '\n' },
      createHTML(data, tree, vfile),
      { type: 'text', value: '\n' },
    ],
  };
};
