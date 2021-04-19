import { Element } from 'hast';
import { load as yaml } from 'js-yaml';
import { FrontmatterContent, Literal } from 'mdast';
import toString from 'mdast-util-to-string';
import { Node } from 'unist';
import { select } from 'unist-util-select';
import visit from 'unist-util-visit';
import { VFile } from 'vfile';

/**
 * Metadata from frontmatter in markdown.
 */
export type Metadata = {
  /** Title. */
  title?: string;
  /** Author. */
  author?: string;
  /** Value to specify for the `class` attribute of `<body>`. */
  class?: string;
  /** Enable math syntax. */
  math?: boolean;
  /** Value that indicates that the document is TOC. */
  toc?: boolean;
};

/**
 * Extension of VFM metadata to VFile data.
 */
export interface MetadataVFile extends VFile {
  data: Metadata;
}

/**
 * Set the author to `<head>`.
 * @param node Node of HAST.
 * @param author Author.
 */
const setAuthor = (node: Element, author: string) => {
  node.children.push({
    type: 'element',
    tagName: 'meta',
    properties: { name: 'author', content: author },
    children: [],
  });
};

/**
 * Set the title to `<head>`.
 * If `<title>` already exists, rewrite its text. Otherwise, add a new one at the end of `<head>`.
 * @param node Node of HAST.
 * @param title Title.
 */
const setTitle = (node: Element, title: string) => {
  const titleElement = node.children.find(
    (elm) => elm.type === 'element' && elm.tagName === 'title',
  ) as Element | undefined;

  if (titleElement) {
    // Overwrite what was set in `rehype-document`
    const text = titleElement.children.find((n) => n.type === 'text');
    if (text) {
      text.value = title;
    } else {
      titleElement.children.push({ type: 'text', value: title });
    }
  } else {
    node.children.push({
      type: 'element',
      tagName: 'title',
      properties: {},
      children: [{ type: 'text', value: title }],
    });
    node.children.push({ type: 'text', value: '\n' });
  }
};

/**
 * Set the class attribute to `<body>`.
 * @param node Node of HAST.
 * @param className Value of class attribute.
 */
const setBodyClass = (node: Element, value: string) => {
  if (node.properties) {
    node.properties.class = value;
  }
};

/**
 * Parse Markdown's Frontmatter to metadate (`VFile.data`).
 * @returns Handler.
 * @see https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-meta/src/index.js
 */
export const mdast = () => (tree: Node, file: MetadataVFile) => {
  const heading = select('heading', tree);
  if (heading) {
    file.data.title = toString(heading);
  }

  visit<FrontmatterContent>(tree, ['yaml'], (node) => {
    const value = yaml(node.value);
    if (typeof value === 'object') {
      file.data = {
        ...file.data,
        ...value,
      };
    }
  });

  file.data.toc = false;
  visit<Literal>(tree, ['shortcode'], (node) => {
    if (node.identifier !== 'toc') return;
    file.data.toc = true;
  });
};

/**
 * Set the metadata to HTML (HAST).
 * @returns Handler.
 */
export const hast = () => (tree: Node, vfile: VFile) => {
  const metadata = vfile as MetadataVFile;
  visit<Element>(tree, 'element', (node) => {
    if (node.tagName === 'head') {
      if (metadata.data.author) {
        setAuthor(node, metadata.data.author);
      }

      if (metadata.data.title) {
        setTitle(node, metadata.data.title);
      }
    }

    if (node.tagName === 'body' && metadata.data.class) {
      setBodyClass(node, metadata.data.class);
    }
  });
};
