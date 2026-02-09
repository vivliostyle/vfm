import type { ElementContent as HastElementContent } from 'hast';
import type { Code, Root } from 'mdast';
import type { Handler, State } from 'mdast-util-to-hast';
import parseAttr from 'md-attr-parser';
import { refractor } from 'refractor';
import type { Node } from 'unist';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

interface HProperties {
  id?: string;
  class?: string[];
  title?: string;
  [key: string]: unknown;
}

function getHProperties(node: Code): HProperties {
  return ((node.data as any)?.hProperties as HProperties) ?? {};
}
function setHProperties(node: Code, props: HProperties): void {
  (node as any).data = { ...((node as any).data ?? {}), hProperties: props };
}

/**
 * Parse `lang:title` syntax and extract title to hProperties.
 */
function extractLangTitle(node: Code): void {
  const match = /^(.+?):(.+)$/.exec(node.lang ?? '');
  if (!match) return;

  const [, lang, title] = match;
  setHProperties(node, { ...getHProperties(node), title });
  node.lang = lang;
  if (node.position?.end.offset) {
    node.position.end.offset -= title.length + 1;
  }
}

/**
 * Parse key=value metadata from meta string.
 */
function parseMetadata(meta: string): Record<string, string> {
  const matches = meta.match(/(?:([^"\s]+?)=([^"\s]+)|([^"\s]+)="([^"]*?)")/g);
  if (!matches) return {};

  return Object.fromEntries(
    matches.map((str) => {
      const [k, v] = str.split('=');
      return [k, v.replace(/(^"|"$)/g, '')];
    }),
  );
}

/**
 * Check if a position in the string is inside a quoted value.
 * Note: Escaped quotes are not considered as parseMetadata doesn't support them.
 */
function isInsideQuotes(meta: string, pos: number): boolean {
  let inQuotes = false;
  for (let i = 0; i < pos; i++) {
    if (meta[i] === '"') {
      inQuotes = !inQuotes;
    }
  }
  return inQuotes;
}

/**
 * Find valid `{...}` attribute block in meta string.
 */
function findValidAttrBlock(
  meta: string,
): { prop: HProperties; eaten: string } | null {
  let searchStart = 0;
  while (searchStart < meta.length) {
    const braceIndex = meta.indexOf('{', searchStart);
    if (braceIndex === -1) break;

    // Skip if inside quoted string like title="foo {#bar}"
    if (isInsideQuotes(meta, braceIndex)) {
      searchStart = braceIndex + 1;
      continue;
    }

    // Attribute block must be at start or preceded by whitespace
    // This prevents matching `{...}` inside values like `title=foo{#bar}`
    if (braceIndex > 0 && !/\s/.test(meta[braceIndex - 1])) {
      searchStart = braceIndex + 1;
      continue;
    }

    const parsed = parseAttr(meta.slice(braceIndex));
    const hasValidAttrs =
      parsed.prop.id !== undefined ||
      parsed.prop.class !== undefined ||
      Object.values(parsed.prop).some((v) => v !== undefined);

    if (parsed.eaten && parsed.eaten.startsWith('{') && hasValidAttrs) {
      return parsed;
    }
    searchStart = braceIndex + 1;
  }
  return null;
}

/**
 * Process meta string to extract title and `{...}` attributes.
 */
function processMeta(node: Code): void {
  if (!node.meta) return;

  const metadata = parseMetadata(node.meta);

  // copy title metadata for figure handler injecting figcaption
  if (metadata.title) {
    setHProperties(node, { ...getHProperties(node), title: metadata.title });
  }

  // Find and apply valid `{...}` attribute block
  const attrBlock = findValidAttrBlock(node.meta);
  const existingTitle = getHProperties(node).title;

  if (attrBlock) {
    setHProperties(node, {
      ...(existingTitle ? { title: existingTitle } : {}),
      ...attrBlock.prop,
    });
  } else {
    // No valid `{...}` in meta, only keep title
    setHProperties(node, existingTitle ? { title: existingTitle } : {});
  }
}

export function mdast() {
  return (tree: Node) => {
    visit(tree as Root, 'code', (node) => {
      extractLangTitle(node);
      processMeta(node);

      // syntax highlight
      if (node.lang && refractor.registered(node.lang)) {
        if (!(node as any).data) (node as any).data = {};
        const highlighted = refractor.highlight(node.value, node.lang);
        // refractor v4 returns a Root node; extract its children
        (node as any).data.hChildren = highlighted.children;
      }
    });
  };
}

export const handler: Handler = (state, node) => {
  const value = node.value || '';
  const lang = node.lang ? node.lang.match(/^[^ \t]+(?=[ \t]|$)/) : 'text';
  const langClass = 'language-' + lang;

  // Merge language-* class with hProperties.class if present
  const hProps = (node as any).data?.hProperties ?? {};
  const hClass = hProps.class;
  const className = hClass
    ? [langClass, ...(Array.isArray(hClass) ? hClass : [hClass])]
    : [langClass];

  const preProps = { className: [langClass] };
  const codeProps = { ...hProps, className };
  // Use hChildren for syntax highlighting if available, otherwise plain text
  const children: HastElementContent[] = (node as any).data?.hChildren ?? [u('text', value)];

  const codeEl: import('hast').Element = {
    type: 'element',
    tagName: 'code',
    properties: codeProps,
    children,
  };

  const preEl: import('hast').Element = {
    type: 'element',
    tagName: 'pre',
    properties: preProps,
    children: [codeEl],
  };

  state.patch(node, preEl);
  return preEl;
};
