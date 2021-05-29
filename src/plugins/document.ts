/**
 * derived from `rehype-document`.
 * original: Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com>
 * modified: 2021 and later is Akabeko
 * @license MIT
 * @see https://github.com/rehypejs/rehype-document
 */

import doctype from 'doctype';
import { Properties } from 'hast';
import h from 'hastscript';
import { Node } from 'unist';
import { VFile } from 'vfile';

/** Options. */
export type DocOptions = {
  /** Text of <html lang="...">. */
  language?: string;
  /**
   * Version of HTML.
   * @see https://github.com/wooorm/doctype
   */
  doctype?: string;
  /** Whether to insert a `meta[viewport]`. */
  responsive?: boolean;
  /** Text of `<title>...</title>`. */
  title?: string;
  /** Array of `<meta>`. */
  meta?: Properties | Properties[];
  /** Array of `<link>`. */
  link?: Properties | Properties[];
  /** Array of `<style>...</style>` */
  style?: string | string[];
  /** Array of `<link ref="stylesheet" href="...">`. */
  css?: string | string[];
  /** Array of `<script>...</script>`. */
  script?: string | string[];
  /** Array of `<script src="...">`. */
  js?: string | string[];
};

/**
 * Makes the specified values into an array.
 * @param value Value.
 * @returns Array.
 */
const castArray = <T>(value: undefined | T | T[]): T[] => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

/**
 * Process Markdown AST.
 * @param options Options.
 * @returns Transformer.
 */
export const mdast = (options: DocOptions) => (tree: Node, vfile: VFile) => {
  const head = [{ type: 'text', value: '\n' }, h('meta', { charset: 'utf-8' })];

  // `<title>...</title>`
  {
    const title = options.title || vfile.stem;
    if (title) {
      head.push({ type: 'text', value: '\n' }, h('title', [title]));
    }
  }

  // `<meta>`
  {
    const properties = castArray<Properties>(options.meta);
    if (options.responsive) {
      properties.unshift({
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      });
    }

    for (const meta of properties) {
      head.push({ type: 'text', value: '\n' }, h('meta', meta));
    }
  }

  // `<link>`
  {
    const properties = castArray<Properties>(options.link);
    for (const link of properties) {
      head.push({ type: 'text', value: '\n' }, h('link', link));
    }
  }

  // `<style>...</style>`
  {
    const styles = castArray<string>(options.style);
    for (const style of styles) {
      head.push({ type: 'text', value: '\n' }, h('style', style));
    }

    head.push({ type: 'text', value: '\n' });
  }

  // `<link rel="stylesheet" href="...">`
  {
    const filePaths = castArray<string>(options.css);
    for (const href of filePaths) {
      head.push(
        { type: 'text', value: '\n' },
        h('link', { rel: 'stylesheet', href }),
      );
    }
  }

  // <body>...</body>
  const contents =
    tree.type === 'root' && Array.isArray(tree.children)
      ? tree.children.concat()
      : [tree];
  if (0 < contents.length) {
    contents.unshift({ type: 'text', value: '\n' });
  }

  // `<script>...</script>` to end of `<body>`
  {
    const scripts = castArray<string>(options.script);
    for (const script of scripts) {
      contents.push({ type: 'text', value: '\n' }, h('script', script));
    }
  }

  // `<script src="...">` to end of `<body>`
  {
    const sources = castArray<string>(options.js);
    for (const src of sources) {
      contents.push({ type: 'text', value: '\n' }, h('script', { src }));
    }

    contents.push({ type: 'text', value: '\n' });
  }

  return {
    type: 'root',
    children: [
      { type: 'doctype', name: doctype(options.doctype || 5) },
      { type: 'text', value: '\n' },
      h('html', { lang: options.language || undefined }, [
        { type: 'text', value: '\n' },
        h('head', head),
        { type: 'text', value: '\n' },
        h('body', contents),
        { type: 'text', value: '\n' },
      ]),
      { type: 'text', value: '\n' },
    ],
  };
};
