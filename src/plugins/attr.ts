import type { Code, Heading, Image, Root, Paragraph, PhrasingContent } from 'mdast';
import parseAttr from 'md-attr-parser';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

/**
 * Parse `{...}` attribute block from the end of a text value.
 * Returns parsed props and the cleaned text, or null if no valid block found.
 */
function parseTrailingAttr(value: string): {
  prop: Record<string, any>;
  cleaned: string;
} | null {
  const match = /\{([^}]+)\}\s*$/.exec(value);
  if (!match) return null;

  const parsed = parseAttr(match[0]);
  if (!parsed.eaten) return null;

  const prop: Record<string, any> = {};
  for (const [k, v] of Object.entries(parsed.prop)) {
    if (v !== undefined) prop[k] = v;
  }

  // If md-attr-parser found no valid props, check for standalone boolean attributes
  // e.g., {hidden} → hidden: true
  if (Object.keys(prop).length === 0) {
    const inner = match[1].trim();
    // Only accept simple word-like attribute names (no spaces, no special chars except hyphens)
    if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(inner)) {
      prop[inner] = true;
    } else {
      return null;
    }
  }

  return { prop, cleaned: value.slice(0, match.index).trimEnd() };
}

/**
 * Apply parsed attributes to a node's hProperties.
 */
function applyHProperties(node: { data?: any }, prop: Record<string, any>) {
  if (!node.data) node.data = {};
  node.data.hProperties = {
    ...(node.data.hProperties as Record<string, unknown>),
    ...prop,
  };
}

/**
 * Custom attribute parser transformer (replaces remark-attr).
 * Parses `{#id .class key=value}` syntax on headings and images.
 */
export const mdast = () => (tree: Node) => {
  // Process headings
  visit(tree as Root, 'heading', (node: Heading, index, parent) => {
    // First, check if the last text child has trailing {attrs}
    const lastChild = node.children[node.children.length - 1];
    if (lastChild && lastChild.type === 'text') {
      const result = parseTrailingAttr(lastChild.value);
      if (result) {
        lastChild.value = result.cleaned;
        if (lastChild.value === '') {
          node.children.pop();
        }
        applyHProperties(node, result.prop);
        return;
      }
    }

    // Check next sibling paragraph for line-break attribute specification:
    // # Heading
    // {#foo}
    if (parent && typeof index === 'number') {
      const nextSibling = (parent as Parent).children[index + 1];
      if (
        nextSibling &&
        nextSibling.type === 'paragraph' &&
        (nextSibling as Paragraph).children.length === 1 &&
        (nextSibling as Paragraph).children[0].type === 'text'
      ) {
        const textNode = (nextSibling as Paragraph).children[0] as { value: string };
        const fullMatch = /^\{([^}]+)\}\s*$/.exec(textNode.value);
        if (fullMatch) {
          const result = parseTrailingAttr(textNode.value);
          if (result) {
            // Remove the attribute paragraph
            (parent as Parent).children.splice(index + 1, 1);
            applyHProperties(node, result.prop);
            return;
          }
        }
      }
    }
  });

  // Process images: ![caption](url){#id .class key=value}
  visit(tree as Root, 'paragraph', (node: Paragraph) => {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.type !== 'image') continue;

      // Check if next sibling is a text node starting with {attrs}
      const nextChild = node.children[i + 1];
      if (!nextChild || nextChild.type !== 'text') continue;

      const textValue = (nextChild as { value: string }).value;
      const match = /^\{([^}]+)\}/.exec(textValue);
      if (!match) continue;

      const parsed = parseAttr(match[0]);
      if (!parsed.eaten) continue;

      const hasValidAttrs =
        parsed.prop.id !== undefined ||
        parsed.prop.class !== undefined ||
        Object.values(parsed.prop).some((v) => v !== undefined);
      if (!hasValidAttrs) continue;

      const prop: Record<string, any> = {};
      for (const [k, v] of Object.entries(parsed.prop)) {
        if (v !== undefined) prop[k] = v;
      }

      applyHProperties(child, prop);

      // Remove the consumed attribute text
      const remaining = textValue.slice(match[0].length);
      if (remaining === '' || /^\s*$/.test(remaining)) {
        node.children.splice(i + 1, 1);
      } else {
        (nextChild as { value: string }).value = remaining;
      }
    }
  });
};
