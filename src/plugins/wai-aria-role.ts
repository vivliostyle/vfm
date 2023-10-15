import { Node } from 'unist';
import visit from 'unist-util-visit';
import { Element } from 'hast';
import { Visitor } from 'unist-util-visit';

/**
 * Collection of class names to which DPUB-ARIA roles are to be added.
 */
const targetClassNames = [
  'abstract',
  'acknowledgments',
  'afterword',
  'appendix',
  'backlink',
  'biblioentry',
  'bibliography',
  'biblioref',
  'chapter',
  'colophon',
  'conclusion',
  'cover',
  'credit',
  'credits',
  'dedication',
  'endnote',
  'endnotes',
  'epigraph',
  'epilogue',
  'errata',
  'example',
  'footnote',
  'foreword',
  'glossary',
  'glossref',
  'index',
  'introduction',
  'noteref',
  'notice',
  'pagebreak',
  'pagelist',
  'pagefooter',
  'pageheader',
  'part',
  'preface',
  'prologue',
  'pullquote',
  'qna',
  'subtitle',
  'tip',
  'toc',
];

/**
 * Process Element node.
 * @param node - Node of HAST.
 * @param index - Index of the node in parent.
 * @param parent - Parent of the node.
 */
const visitor: Visitor<Element> = (node) => {
  if (!(node.properties && Array.isArray(node.properties.className))) {
    return;
  }

  for (const className of node.properties.className) {
    if (typeof className === 'string' && targetClassNames.includes(className)) {
      if (Array.isArray(node.properties.role)) {
        node.properties.role.push(`doc-${className}`);
      } else {
        node.properties.role = [`doc-${className}`];
      }
    }
  }
};

/**
 * If any element in HAST has a vocabulary class defined in DPUB-ARIA, add the corresponding `role` attribute.
 * @see https://w3c.github.io/dpub-aria/#roles
 */
export const hast = () => (tree: Node) => {
  visit<Element>(tree, 'element', visitor);
};
