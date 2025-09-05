import { Element, Node, Root as HastRoot } from 'hast';
import { select, selectAll } from 'hast-util-select';
import footnotes from 'remark-footnotes';

/**
 * Replace the footnote link with Pandoc format.
 * @param tree Tree of Hypertext AST.
 */
const replaceFootnoteLinks = (tree: Node) => {
  const sups = (
    selectAll('sup[id^="fnref-"]', tree as HastRoot) as Element[]
  ).filter(
    (node) => node.children.length === 1 && node.children[0].tagName === 'a',
  );

  for (let i = 0; i < sups.length; ++i) {
    const parent = sups[i];
    const refIndex = i + 1;
    parent.tagName = 'a';
    parent.properties = {
      id: `fnref${refIndex}`,
      href: `#fn${refIndex}`,
      className: ['footnote-ref'],
      role: 'doc-noteref',
    };

    const child = parent.children[0];
    child.tagName = 'sup';
    child.properties = {};
    child.children = [{ type: 'text', value: `${refIndex}` }];
  }
};

/**
 * Check if it has a class name as a back reference.
 * @param className Array of class names.
 * @returns `true` for back reference, `false` otherwise.
 */
const hasBackReferenceClass = (className: any) => {
  if (Array.isArray(className)) {
    for (const name of className) {
      if (name === 'footnote-backref') {
        return true;
      }
    }
  }

  return false;
};

/**
 * Replace back reference with Pandoc format.
 * @param elements Children elements of footnote.
 * @param index Index of footnote.
 */
const replaceBackReference = (elements: any[], index: number) => {
  for (const element of elements) {
    if (
      element.type === 'element' &&
      element.tagName === 'a' &&
      element.properties &&
      hasBackReferenceClass(element.properties.className)
    ) {
      element.properties.href = `#fnref${index}`;
      element.properties.className = ['footnote-back'];
      element.properties.role = 'doc-backlink';

      // Back reference is only one
      break;
    }
  }
};

/**
 * Replace the footnote with Pandoc format.
 * @param tree Tree of Hypertext AST.
 */
const replaceFootnotes = (tree: Node) => {
  const area = select('div.footnotes', tree as HastRoot) as Element | undefined;
  if (area && area.properties) {
    area.tagName = 'section';
    area.properties.role = 'doc-endnotes';
  } else {
    return;
  }

  const items = selectAll(
    'section.footnotes ol li',
    tree as HastRoot,
  ) as Element[];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    if (!item.properties) {
      continue;
    }

    const refIndex = i + 1;
    item.properties.id = `fn${refIndex}`;
    item.properties.role = 'doc-endnote';
    replaceBackReference(item.children, refIndex);
  }
};

/**
 * Process Markdown AST.
 */
export const mdast = [footnotes, { inlineNotes: true }];

/**
 * Process math related Hypertext AST.
 * Resolves HTML diffs between `remark-footnotes` and Pandoc footnotes.
 */
export const hast = () => (tree: Node) => {
  replaceFootnoteLinks(tree);
  replaceFootnotes(tree);
};
