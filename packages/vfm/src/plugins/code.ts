import type { ElementContent as HastElementContent, Properties } from 'hast';
import type { Code, Root } from 'mdast';
import type { Handler } from 'mdast-util-to-hast';
import parseAttr from 'md-attr-parser';
import refractor from 'refractor';
import type { Node } from 'unist';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
import { type FigureOptions, propertyToString } from './figure.js';

/**
 * Module augmentation is global, so this single declaration applies
 * project-wide. Currently relied on by:
 *
 * - `code.ts` (this file): `hProperties`, `hChildren`
 * - `section.ts`: `hProperties`, `hName`
 * - `slug.ts`: `hProperties.id`
 *
 * @todo Drop after upgrading to `mdast-util-to-hast@>=13`, which ships the
 *   same `Data` augmentation as a side effect import.
 */
declare module 'unist' {
  interface Data {
    hName?: string | undefined;
    hProperties?: Properties | undefined;
    hChildren?: HastElementContent[] | undefined;
  }
}

function getHProperties(node: Code): Properties {
  return node.data?.hProperties ?? {};
}
function setHProperties(node: Code, props: Properties): void {
  node.data = { ...(node.data ?? {}), hProperties: props };
}

/**
 * Parse `lang:title` syntax and extract title to hProperties.
 */
function extractLangTitle(node: Code): void {
  const match = /^(.+?):(.+)$/.exec(node.lang ?? '');
  if (!match) return;

  // The regex has exactly 2 capture groups
  const lang = match[1]!;
  const title = match[2]!;
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
      // Each pattern captures one group before and after '='
      const [k, v] = str.split('=') as [string, string];
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
): { prop: Properties; eaten: string } | null {
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
    if (braceIndex > 0 && !/\s/.test(meta[braceIndex - 1]!)) {
      searchStart = braceIndex + 1;
      continue;
    }

    const parsed = parseAttr(meta.slice(braceIndex));
    const hasValidAttrs =
      parsed.prop.id !== undefined ||
      parsed.prop.class !== undefined ||
      Object.values(parsed.prop).some((v) => v !== undefined);

    if (parsed.eaten && parsed.eaten.startsWith('{') && hasValidAttrs) {
      return { prop: parsed.prop as Properties, eaten: parsed.eaten };
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

export const mdast = () => (tree: Node) => {
  visit(tree as Root, 'code', (node) => {
    /**
     * Workaround for remark-attr's "bad hack".
     * When meta is null, remark-attr parses code content as attributes.
     * @see https://github.com/arobase-che/remark-attr/blob/325f0ef730eafa601c9b631ea175b26c18c85a4a/src/index.js#L260-L263
     */
    if (!node.meta && node.data?.hProperties) {
      delete node.data.hProperties;
    }

    extractLangTitle(node);
    processMeta(node);

    // syntax highlight
    if (node.lang && refractor.registered(node.lang)) {
      if (!node.data) node.data = {};
      node.data.hChildren = refractor.highlight(
        node.value,
        node.lang,
      ) as HastElementContent[];
    }
  });
};

export const handler =
  ({ assignIdToFigcaption = false }: FigureOptions = {}): Handler =>
  (h, node) => {
    const value = node.value || '';
    const lang = node.lang ? node.lang.match(/^[^ \t]+(?=[ \t]|$)/) : 'text';
    const langClass = 'language-' + lang;

    // Strip `title` from code element props; it becomes the figcaption text.
    const hProps = { ...(node.data?.hProperties ?? {}) };
    const title = hProps.title;
    delete hProps.title;

    // Merge language-* class with hProperties.class if present
    const hClass = hProps.class;
    const className = hClass
      ? [langClass, ...(Array.isArray(hClass) ? hClass : [hClass])]
      : [langClass];

    const preProps = { className: [langClass] };
    const codeProps = { ...hProps, className };
    // Use hChildren for syntax highlighting if available, otherwise plain text
    const children = node.data?.hChildren ?? [u('text', value)];

    if (!title) {
      return h(node.position, 'pre', preProps, [
        h(node.position, 'code', codeProps, children),
      ]);
    }

    const figcaptionProps: Properties = {};
    if (assignIdToFigcaption && codeProps.id) {
      figcaptionProps.id = codeProps.id;
      delete codeProps.id;
    }

    return h(node.position, 'figure', { class: langClass }, [
      h({ type: 'element' }, 'figcaption', figcaptionProps, [
        u('text', propertyToString(title)),
      ]),
      h(node.position, 'pre', preProps, [
        h(node.position, 'code', codeProps, children),
      ]),
    ]);
  };
