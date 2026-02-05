import {
  Element,
  ElementContent,
  Node,
  Properties,
  Root as HastRoot,
} from 'hast';
import { select, selectAll } from 'hast-util-select';
import { h } from 'hastscript';
import footnotes from 'remark-footnotes';
import { EXIT, SKIP, visitParents } from 'unist-util-visit-parents';

/**
 * Stringify a HAST property value.
 * @param propValue Property value.
 * @returns Stringified value or `null`.
 */
const stringifyPropValue = (propValue: Properties[string]): string | null =>
  typeof propValue === 'string' || typeof propValue === 'number'
    ? String(propValue)
    : propValue === true
    ? ''
    : Array.isArray(propValue)
    ? propValue.map((val) => String(val)).join(' ')
    : null;

/**
 * NOTE: VFM depends on two versions of mdast-util-to-hast;
 * endnote generation uses the one resolved via remark-rehype:
 *  `- remark-rehype@8.1.0
 *  |   `- mdast-util-to-hast@10.2.0  <-- this one
 *  `- mdast-util-to-hast@11.3.0
 */

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L55-L66
 */
const endnoteAreaSelector = 'div.footnotes';
const endnoteElementSelector = `${endnoteAreaSelector} ol li[id^="fn-"]`;

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L45
 */
type EndnoteElement = Element & {
  tagName: 'li';
  properties: Properties & { id: `fn-${string}` };
};

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/handlers/footnote-reference.js#L15
 */
const endnoteCallSelector =
  'sup[id^="fnref-"]:has(a:only-child[href^="#fn-"].footnote-ref)';

/**
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/handlers/footnote-reference.js#L15-L19
 */
type EndnoteCall = Element & {
  tagName: 'sup';
  properties: Properties & { id: `fnref-${string}` };
  children: [
    Element & {
      tagName: 'a';
      properties: Properties & {
        href: `#${string}`;
        className: ['footnote-ref'];
      };
    },
  ];
};

/**
 * Replace the footnote link with Pandoc format.
 * @param tree Tree of Hypertext AST.
 */
const replaceFootnoteLinks = (tree: Node) => {
  const sups = (
    selectAll(endnoteCallSelector, tree as HastRoot) as Element[]
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
 * Check if a node is a back reference anchor.
 * @see https://github.com/syntax-tree/mdast-util-to-hast/blob/10.2.0/lib/footer.js#L32
 * @param node Node to check.
 * @returns `true` for back reference, `false` otherwise.
 */
const isBackReference = (node: ElementContent) =>
  node.type === 'element' &&
  node.tagName === 'a' &&
  Array.isArray(node.properties?.className) &&
  node.properties.className.includes('footnote-backref');

/**
 * Replace back reference with Pandoc format.
 * @param elements Children elements of footnote.
 * @param index Index of footnote.
 */
const replaceBackReference = (elements: any[], index: number) => {
  for (const element of elements) {
    if (isBackReference(element)) {
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

/** Factory that returns a customized h function for creating footnote elements. */
export type FootnoteFactory = (
  h: typeof import('hastscript').h,
) => typeof import('hastscript').h;

/** Options for the footnotes HAST plugin. */
export type FootnoteOptions = {
  /** Convert endnotes to inline footnotes for CSS GCPM `float: footnote`. */
  endnotesAsFootnotes?: boolean | FootnoteFactory;
};

/**
 * Convert endnotes to inline footnotes for CSS GCPM `float: footnote`.
 *
 * Works directly with remark-footnotes output, bypassing Pandoc format conversion.
 * - References: `sup[id^="fnref-"]` containing `<a href="#fn-xxx">`
 * - Section: `div.footnotes > ol > li[id^="fn-"]`
 * - Backrefs: `a.footnote-backref`
 *
 * @param tree HAST tree.
 * @param options Footnote options.
 */
const convertEndnotesToFootnotes = (
  tree: HastRoot,
  options: FootnoteOptions,
) => {
  const factory =
    typeof options.endnotesAsFootnotes === 'function'
      ? options.endnotesAsFootnotes(h)
      : h;

  const endnoteElements = (
    selectAll(endnoteElementSelector, tree) as EndnoteElement[]
  ).reduce(
    (map, li) =>
      map.set(
        li.properties.id,
        li.children.filter((child) => !isBackReference(child)),
      ),
    new Map<string, ElementContent[]>(),
  );

  const endnoteCallReplacements = new Map(
    // selectAll with endnoteCallSelector guarantees EndnoteCall[]
    (selectAll(endnoteCallSelector, tree) as EndnoteCall[]).flatMap(
      (endnoteCall) => {
        const endnoteId = endnoteCall.children[0].properties.href.slice(1);
        const endnoteElement = endnoteElements.get(endnoteId);
        return !endnoteElement
          ? []
          : [
              [
                endnoteCall,
                factory('span', { class: 'footnote' }, ...endnoteElement),
              ],
            ];
      },
    ),
  );

  // Replace each sup reference with an inline footnote element
  visitParents(tree, 'element', (el, ancestors) => {
    const replacement = endnoteCallReplacements.get(
      // @ts-expect-error check membership
      el,
    );
    if (!replacement) {
      return;
    }
    const parent = ancestors.at(-1);
    if (!parent) {
      return; // Root
    }
    parent.children = parent.children.map((c) => (c === el ? replacement : c));
    return SKIP;
  });

  // Remove all footnote sections
  const endnoteAreas = selectAll(endnoteAreaSelector, tree);
  let removed = 0;
  visitParents(tree, 'element', (node, ancestors) => {
    if (!endnoteAreas.includes(node)) return;
    const parent = ancestors[ancestors.length - 1];
    parent.children = parent.children.filter((c) => c !== node);
    removed++;
    return removed === endnoteAreas.length ? EXIT : SKIP;
  });
};

/**
 * Process footnote-related Hypertext AST.
 * When endnotesAsFootnotes is enabled, converts endnotes to inline GCPM footnotes.
 * Otherwise, resolves HTML diffs between `remark-footnotes` and Pandoc footnotes.
 */
export const hast =
  (options: FootnoteOptions = {}) =>
  (tree: Node) => {
    if (options.endnotesAsFootnotes) {
      convertEndnotesToFootnotes(tree as HastRoot, options);
    } else {
      replaceFootnoteLinks(tree);
      replaceFootnotes(tree);
    }
  };
