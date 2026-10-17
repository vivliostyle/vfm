import type * as hast from 'hast';
import type * as mdastType from 'mdast';
import type { Handler } from 'mdast-util-to-hast';
import parseAttr from 'md-attr-parser';
// `refractor/all` registers every language, as `refractor` 3 did by default.
import { refractor } from 'refractor/all';
import type * as unist from 'unist';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
import * as v from 'valibot';

export const CodeOptionsSchema = v.object({
  assignIdToFigcaption: v.optional(
    v.pipe(
      v.boolean(),
      v.description('Assign ID to figcaption instead of the `<code>` element.'),
    ),
  ),
});

export type CodeOptions = v.InferInput<typeof CodeOptionsSchema>;

/**
 * Whether a value is an mdast `code` node.
 * @param maybeMdastNode - Value to test.
 * @returns `true` for a `code` node.
 */
const isCodeNode = (
  maybeMdastNode: unknown,
): maybeMdastNode is mdastType.Code => {
  if (!maybeMdastNode || typeof maybeMdastNode !== 'object') return false;
  return (maybeMdastNode as { type?: unknown }).type === 'code';
};

/**
 * `hName` / `hProperties` / `hChildren` on mdast `Data` come from
 * `mdast-util-to-hast` (imported above). Only the VFM-specific channel is
 * declared here.
 */
declare module 'mdast' {
  interface CodeData {
    /**
     * Internal channel used by the code plugin to carry the caption text
     * extracted from `lang:title`, `title=...` meta, or `{title="..."}` attr
     * blocks through to the handler. Kept off `hProperties` so it never
     * leaks into actual HTML attributes.
     */
    figcaptionTitle?: string | undefined;
  }
}

/**
 * Store `props` as the node's `hProperties`.
 * @param node - Code node.
 * @param props - Properties for the `<code>` element.
 */
function setHProperties(node: mdastType.Code, props: hast.Properties): void {
  node.data = { ...(node.data ?? {}), hProperties: props };
}
/**
 * Store the caption text on the node's internal `figcaptionTitle` channel.
 * @param node - Code node.
 * @param title - Caption text.
 */
function setFigcaptionTitle(node: mdastType.Code, title: string): void {
  node.data = { ...(node.data ?? {}), figcaptionTitle: title };
}

/**
 * Parse `lang:title` syntax and extract title to the figcaption channel.
 */
function extractLangTitle(node: mdastType.Code): void {
  const match = /^(.+?):(.+)$/.exec(node.lang ?? '');
  if (!match) return;

  // The regex has exactly 2 capture groups
  const lang = match[1]!;
  const title = match[2]!;
  setFigcaptionTitle(node, title);
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
): { prop: hast.Properties; eaten: string } | null {
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
      return { prop: parsed.prop as hast.Properties, eaten: parsed.eaten };
    }
    searchStart = braceIndex + 1;
  }
  return null;
}

/**
 * Process meta string to extract title and `{...}` attributes.
 */
function processMeta(node: mdastType.Code): void {
  if (!node.meta) return;

  const metadata = parseMetadata(node.meta);
  if (metadata.title) {
    setFigcaptionTitle(node, metadata.title);
  }

  const attrBlock = findValidAttrBlock(node.meta);
  if (attrBlock) {
    // attrBlock can carry `title=...`; route it through the figcaption channel
    // and keep only HTML attributes on hProperties.
    const { title: blockTitle, ...rest } = attrBlock.prop;
    if (typeof blockTitle === 'string') {
      setFigcaptionTitle(node, blockTitle);
    }
    setHProperties(node, rest);
  } else {
    setHProperties(node, {});
  }
}

/**
 * remark plugin: extract `lang:title`, `title=` meta and `{...}` attributes
 * from fenced code and highlight the code into `hChildren`.
 * @returns Transformer.
 */
export const mdast = () => (tree: unist.Node) => {
  visit(tree as mdastType.Root, 'code', (node) => {
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

    // syntax highlight (refractor 4+ returns a `Root`; keep its children)
    if (node.lang && refractor.registered(node.lang)) {
      if (!node.data) node.data = {};
      node.data.hChildren = refractor.highlight(node.value, node.lang)
        .children as hast.ElementContent[];
    }
  });
};

/**
 * Build a hast element.
 * @param tagName - Element name.
 * @param properties - Properties.
 * @param children - Children.
 * @returns Element.
 */
const element = (
  tagName: string,
  properties: hast.Properties,
  children: hast.ElementContent[],
): hast.Element => ({ type: 'element', tagName, properties, children });

/**
 * Create the to-hast `code` handler: `<pre><code>` with the language class,
 * attributes and highlighted children, wrapped in `<figure>` with a
 * `<figcaption>` when the code has a title.
 * @param options - `assignIdToFigcaption` moves the id from `<code>` to
 *   `<figcaption>`.
 * @returns Handler.
 */
export const handler =
  ({ assignIdToFigcaption = false }: CodeOptions = {}): Handler =>
  (state, maybeMdastNode) => {
    if (!isCodeNode(maybeMdastNode)) return undefined;

    const node = maybeMdastNode;
    const value = node.value || '';
    const langMatch = node.lang?.match(/^[^ \t]+(?=[ \t]|$)/);
    const lang = langMatch?.[0] ?? 'text';
    const langClass = 'language-' + lang;

    const title = node.data?.figcaptionTitle;
    const hProps: hast.Properties = { ...(node.data?.hProperties ?? {}) };

    // Merge language-* class with hProperties.class if present. `hProps.class`
    // can theoretically be any `Properties[key]` value; coerce every token to
    // string so the resulting className stays `string[]`.
    const hClass = hProps.class;
    const className: string[] = hClass
      ? [langClass, ...(Array.isArray(hClass) ? hClass : [hClass]).map(String)]
      : [langClass];

    const preProps: hast.Properties = { className: [langClass] };
    const codeProps: hast.Properties = { ...hProps, className };
    // Use hChildren for syntax highlighting if available, otherwise plain text
    const children = node.data?.hChildren ?? [u('text', value)];

    const code = element('code', codeProps, children);
    state.patch(node, code);
    const pre = element('pre', preProps, [code]);
    state.patch(node, pre);

    if (!title) {
      return pre;
    }

    const figcaptionProps: hast.Properties = {};
    if (assignIdToFigcaption && codeProps.id) {
      figcaptionProps.id = codeProps.id;
      delete codeProps.id;
    }

    const figure = element('figure', { className: [langClass] }, [
      element('figcaption', figcaptionProps, [u('text', title)]),
      pre,
    ]);
    state.patch(node, figure);
    return figure;
  };
