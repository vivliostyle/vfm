import { load as yaml } from 'js-yaml';
import { FrontmatterContent, Literal } from 'mdast';
import toString from 'mdast-util-to-string';
import { Node } from 'unist';
import { select } from 'unist-util-select';
import visit from 'unist-util-visit';
import { VFile } from 'vfile';
import { HastNode } from './hastnode';

/**
 * Extension of VFM metadata to VFile data.
 */
interface MetadataVFile extends VFile {
  data: {
    /** Title. */
    title?: string;
    /** Author. */
    author?: string;
    /** Value to specify for the `class` attribute of `<body>`. */
    class?: string;
    /** Value that indicates that the document is TOC. */
    toc?: boolean;
  };
}

/**
 * Set the author to `<head>`.
 * @param node Node of HAST.
 * @param author Author.
 */
const setAuthor = (node: HastNode, author: string) => {
  node.children.push({
    type: 'element',
    tagName: 'meta',
    properties: { name: 'author', content: author },
    children: [],
  });
};

/**
 * Set the title to `<head>`.
 * @param node Node of HAST.
 * @param title Title.
 */
const setTitle = (node: HastNode, title: string) => {
  const titleElement = node.children.find(
    (elm) => elm.type === 'element' && elm.tagName === 'title',
  ) as HastNode | undefined;

  if (titleElement) {
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
const setBodyClass = (node: HastNode, value: string) => {
  node.properties.class = value;
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
export const hast = () => (tree: Node, vfile: MetadataVFile) => {
  visit<HastNode>(tree, 'element', (node) => {
    if (node.tagName === 'head') {
      if (vfile.data.author) {
        setAuthor(node, vfile.data.author);
      }

      if (vfile.data.title) {
        setTitle(node, vfile.data.title);
      }
    }

    if (node.tagName === 'body' && vfile.data.class) {
      setBodyClass(node, vfile.data.class);
    }
  });
};
