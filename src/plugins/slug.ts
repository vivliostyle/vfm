/**
 * derived from `remark-slug`.
 * original: Copyright (c) 2015 Titus Wormer <tituswormer@gmail.com>
 * modified: 2021 and later is Akabeko
 * @license MIT
 * @see https://github.com/remarkjs/remark-slug
 */

import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { Node } from 'unist';
import { selectAll } from 'unist-util-select';

/**
 * Heading in Markdown AST.
 */
interface Heading extends Node {
  children: Node[];
  data?: {
    id?: string;
    hProperties?: {
      id?: string;
    };
  };
}

/**
 * Create slug from `id` or heading children.
 * @param heading Heading.
 * @param slugs Slugger.
 * @returns
 */
const createSlug = (heading: Heading, slugger: GithubSlugger) => {
  if (heading.data && heading.data.hProperties && heading.data.hProperties.id) {
    return slugger.slug(heading.data.hProperties.id, true);
  }

  // Create slug string with footnotes removed
  const children = [...heading.children];
  heading.children = heading.children.filter(
    (child: Node) => child.type !== 'footnoteReference',
  );
  const text = slugger.slug(toString(heading).replace(/<[^<>]*>/g, ''));
  heading.children = children;

  return text;
};

/**
 * Process Markdown AST.
 * @returns Transformer.
 */
export const mdast = () => (tree: any) => {
  const slugger = new GithubSlugger();
  slugger.reset();

  const headings = selectAll('heading', tree) as Heading[];
  for (const heading of headings) {
    const id = createSlug(heading, slugger);
    if (!heading.data) {
      heading.data = {};
    }

    if (!heading.data.hProperties) {
      heading.data.hProperties = {};
    }

    heading.data.id = id;
    heading.data.hProperties.id = id;
  }
};
