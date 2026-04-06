import { htmlElementAttributes } from 'html-element-attributes';
import type * as mdast from 'mdast';
import type * as fromMarkdown from 'mdast-util-from-markdown';
import type {} from 'mdast-util-to-hast'; // declare module 'mdast' { interface Data { hProperties?: Properties | undefined } }
import { parseEntities } from 'parse-entities';
import { visitParents } from 'unist-util-visit-parents';

declare module 'mdast-util-from-markdown' {
  interface CompileData {
    attributeList?: Array<[string, string]> | undefined;
  }
}

interface AttributeInline extends mdast.Node {
  type: 'attributeInline';
  attributes: Record<string, string>;
  children: [];
}

interface AttributeBlock extends mdast.Node {
  type: 'attributeBlock';
  attributes: Record<string, string>;
  children: [];
}

declare module 'mdast' {
  interface RootContentMap {
    attributeBlock: AttributeBlock;
    attributeInline: AttributeInline;
  }
  interface PhrasingContentMap {
    attributeInline: AttributeInline;
  }
}

const codeMetaAttributes = new WeakMap<mdast.Nodes, Record<string, string>>();

export interface Options {
  allowDangerousDOMEventHandlers?: boolean;
  extend?: Record<string, string[]>;
  scope?: 'none' | 'global' | 'specific' | 'extended' | 'permissive' | 'every';
  enableAtxHeaderInline?: boolean;
  disableBlockElements?: boolean;
}

interface Config {
  allowDangerousDOMEventHandlers: boolean;
  extend: Record<string, string[]>;
  scope: string;
  enableAtxHeaderInline: boolean;
  disableBlockElements: boolean;
}

const enterAttributes = (type: (AttributeInline | AttributeBlock)['type']) =>
  function (this: fromMarkdown.CompileContext, token: fromMarkdown.Token) {
    this.data.attributeList = [];
    this.enter({ type, attributes: {}, children: [] }, token);
    this.buffer();
  };

function exitAttributeIdValue(
  this: fromMarkdown.CompileContext,
  token: fromMarkdown.Token,
) {
  this.data.attributeList?.push([
    'id',
    parseEntities(this.sliceSerialize(token), { attribute: true }),
  ]);
}

function exitAttributeClassValue(
  this: fromMarkdown.CompileContext,
  token: fromMarkdown.Token,
) {
  this.data.attributeList?.push([
    'class',
    parseEntities(this.sliceSerialize(token), { attribute: true }),
  ]);
}

function exitAttributeName(
  this: fromMarkdown.CompileContext,
  token: fromMarkdown.Token,
) {
  this.data.attributeList?.push([this.sliceSerialize(token), '']);
}

function exitAttributeValue(
  this: fromMarkdown.CompileContext,
  token: fromMarkdown.Token,
) {
  const list = this.data.attributeList;
  if (!list) {
    return;
  }
  const last = list.at(-1);
  if (!last) {
    return;
  }
  last[1] = parseEntities(this.sliceSerialize(token), {
    attribute: true,
  });
}

/**
 * Clean raw attribute list into a map, merging classes.
 */
const cleanAttributes = (list: [string, string][]) =>
  list.reduce((cleaned, [key, value]) => {
    if (key === 'class' && cleaned.class) {
      cleaned.class += ' ' + value;
    } else {
      cleaned[key] = value;
    }
    return cleaned;
  }, {} as Record<string, string>);

const exitAttributes = (type: (AttributeInline | AttributeBlock)['type']) =>
  function (this: fromMarkdown.CompileContext, token: fromMarkdown.Token) {
    const list = this.data.attributeList;
    if (!list) {
      return;
    }
    this.data.attributeList = undefined;
    this.resume();
    const node = this.stack.at(-1);
    if (!node || node.type !== type) {
      return;
    }
    node.attributes = cleanAttributes(list);
    this.exit(token);
  };

function enterCodeMetaAttributes(this: fromMarkdown.CompileContext) {
  this.data.attributeList = [];
}

function exitCodeMetaAttributes(this: fromMarkdown.CompileContext) {
  const list = this.data.attributeList;
  if (!list) {
    return;
  }
  this.data.attributeList = undefined;
  const node = this.stack.at(-1);
  if (node && node.type === 'code') {
    codeMetaAttributes.set(node, cleanAttributes(list));
  }
}

function exitCodeFencedFenceMeta(this: fromMarkdown.CompileContext) {
  const value = this.resume();
  const node = this.stack.at(-1);
  if (node && node.type === 'code') {
    node.meta = value.trimEnd() || null;
  }
}

/**
 * Transform the tree to attach attribute nodes to their targets.
 */
const transformAttributes = (config: Config) => (tree: mdast.Root) => {
  // Handle fenced code meta attributes (tokenized by micromark)
  visitParents(tree, 'code', (node) => {
    const attributes = codeMetaAttributes.get(node);
    if (attributes) {
      codeMetaAttributes.delete(node);
      assignAttributes(node, attributes, config);
    }
  });

  if (!config.disableBlockElements) {
    handleBlockAttributes(tree, config);
  }
  handleInlineAttributes(tree, config);
};

/**
 * Create an extension for `mdast-util-from-markdown` to enable attributes.
 */
export function attributeFromMarkdown(
  options?: Readonly<Options> | null | undefined,
): fromMarkdown.Extension {
  const config: Config = {
    allowDangerousDOMEventHandlers: false,
    extend: {},
    scope: 'extended',
    enableAtxHeaderInline: true,
    disableBlockElements: false,
    ...options,
  };

  return {
    enter: {
      inlineAttributes: enterAttributes('attributeInline'),
      blockAttributes: enterAttributes('attributeBlock'),
      codeMetaAttributes: enterCodeMetaAttributes,
    },
    exit: {
      inlineAttributeIdValue: exitAttributeIdValue,
      inlineAttributeClassValue: exitAttributeClassValue,
      inlineAttributeName: exitAttributeName,
      inlineAttributeValue: exitAttributeValue,
      inlineAttributes: exitAttributes('attributeInline'),

      blockAttributeIdValue: exitAttributeIdValue,
      blockAttributeClassValue: exitAttributeClassValue,
      blockAttributeName: exitAttributeName,
      blockAttributeValue: exitAttributeValue,
      blockAttributes: exitAttributes('attributeBlock'),

      codeMetaAttributeIdValue: exitAttributeIdValue,
      codeMetaAttributeClassValue: exitAttributeClassValue,
      codeMetaAttributeName: exitAttributeName,
      codeMetaAttributeValue: exitAttributeValue,
      codeMetaAttributes: exitCodeMetaAttributes,
      codeFencedFenceMeta: exitCodeFencedFenceMeta,
    },
    transforms: [transformAttributes(config)],
  };
}

const serializeAttributes = (attributes: Record<string, string>) =>
  '{' +
  Object.entries(attributes)
    .flatMap(([key, value]) =>
      key === 'id'
        ? ['#' + value]
        : key === 'class'
        ? value
            .split(/\s+/)
            .filter(Boolean)
            .map((cls) => '.' + cls)
        : value
        ? [key + '="' + value + '"']
        : [key],
    )
    .join(' ') +
  '}';

const isBlockTarget = (node: mdast.RootContent) =>
  node.type === 'heading' ||
  node.type === 'paragraph' ||
  node.type === 'code' ||
  node.type === 'blockquote' ||
  node.type === 'list' ||
  node.type === 'table' ||
  node.type === 'thematicBreak';

const createFallbackParagraph = (node: AttributeBlock): mdast.Paragraph => ({
  type: 'paragraph',
  children: [{ type: 'text', value: serializeAttributes(node.attributes) }],
  position: node.position,
});

/**
 * Handle block-level attribute nodes.
 * Block attributes appear as direct children of root, after headings etc.
 */
function handleBlockAttributes(tree: mdast.Root, config: Config): void {
  let index = tree.children.length - 1;

  while (index >= 0) {
    const node = tree.children[index];

    if (node && node.type === 'attributeBlock') {
      // Look for preceding sibling to attach to
      let targetIndex = index - 1;
      while (
        targetIndex >= 0 &&
        tree.children[targetIndex]?.type === 'attributeBlock'
      ) {
        targetIndex--;
      }

      const target = targetIndex >= 0 ? tree.children[targetIndex] : undefined;

      if (target && isBlockTarget(target)) {
        assignAttributes(target, node.attributes, config);
        tree.children.splice(index, 1);
      } else {
        // Unattached: convert to paragraph with literal text
        tree.children[index] = createFallbackParagraph(node);
      }
    }

    index--;
  }
}

const hasPhrasingContent = (node: mdast.Nodes) =>
  node.type === 'paragraph' ||
  node.type === 'heading' ||
  node.type === 'link' ||
  node.type === 'emphasis' ||
  node.type === 'strong' ||
  node.type === 'delete' ||
  node.type === 'linkReference';

/**
 * Handle attribute inline inside a heading (e.g. `# Title {.class}`).
 * The attribute applies to the heading itself.
 */
function handleHeadingInlineAttribute(
  heading: mdast.Heading,
  attrIndex: number,
  config: Config,
): boolean {
  const attr = heading.children[attrIndex];
  if (!attr || attr.type !== 'attributeInline') return false;

  // Only handle if it's the last meaningful child
  // Check that nothing follows except whitespace text
  let isLast = true;
  for (let i = attrIndex + 1; i < heading.children.length; i++) {
    const sibling = heading.children[i];
    if (!sibling || sibling.type !== 'text' || sibling.value.trim() !== '') {
      isLast = false;
      break;
    }
  }

  if (!isLast) return false;

  // Don't apply if heading ONLY contains the attribute (e.g. `# {.class}`)
  let hasContentBefore = false;
  for (let i = 0; i < attrIndex; i++) {
    const sibling = heading.children[i];
    if (!sibling || sibling.type !== 'text' || sibling.value.trim() !== '') {
      hasContentBefore = true;
      break;
    }
  }

  if (!hasContentBefore) return false;

  // Apply to heading
  assignAttributes(heading, attr.attributes, config);

  // Remove attribute node and any trailing whitespace nodes
  heading.children.splice(attrIndex, heading.children.length - attrIndex);

  // Trim trailing whitespace from the last remaining text child
  const lastChild = heading.children[heading.children.length - 1];
  if (lastChild && lastChild.type === 'text') {
    lastChild.value = lastChild.value.replace(/\s+$/, '');
  }

  return true;
}

const isInlineTarget = (node: mdast.PhrasingContent) =>
  node.type === 'strong' ||
  node.type === 'emphasis' ||
  node.type === 'link' ||
  node.type === 'image' ||
  node.type === 'inlineCode' ||
  node.type === 'delete' ||
  node.type === 'linkReference';

const createFallbackText = (node: AttributeInline): mdast.Text => ({
  type: 'text',
  value: serializeAttributes(node.attributes),
  position: node.position,
});

/**
 * Handle inline attribute nodes within paragraphs and headings.
 */
function handleInlineAttributes(tree: mdast.Root, config: Config): void {
  visitParents(tree, (node) => {
    if (!('children' in node) || !hasPhrasingContent(node)) {
      return;
    }
    let index = node.children.length - 1;

    while (index >= 0) {
      const child = node.children[index];

      if (child && child.type === 'attributeInline') {
        // Case 2: Inside a heading — attach to heading itself
        if (node.type === 'heading' && config.enableAtxHeaderInline !== false) {
          const handled = handleHeadingInlineAttribute(
            node as mdast.Heading,
            index,
            config,
          );
          if (handled) {
            index--;
            continue;
          }
        }

        // Case 1: Inline — attach to preceding sibling
        const target = index > 0 ? node.children[index - 1] : undefined;

        if (target && isInlineTarget(target as mdast.PhrasingContent)) {
          assignAttributes(target, child.attributes, config);
          node.children.splice(index, 1);

          // Trim trailing whitespace from preceding text if needed
        } else {
          // Unattached: convert to text
          node.children[index] = createFallbackText(child);
        }
      }

      index--;
    }
  });
}

const domEventHandlers: ReadonlySet<string> = new Set([
  'onabort',
  'onautocomplete',
  'onautocompleteerror',
  'onblur',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncontextmenu',
  'oncuechange',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragexit',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onpause',
  'onplay',
  'onplaying',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onseeked',
  'onseeking',
  'onselect',
  'onshow',
  'onsort',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'onvolumechange',
  'onwaiting',
]);

/** mdast node type -> HTML tag name */
const convTypeTag: ReadonlyMap<string, string> = new Map([
  ['image', 'img'],
  ['link', 'a'],
  ['heading', 'h1'],
  ['strong', 'strong'],
  ['emphasis', 'em'],
  ['delete', 's'],
  ['inlineCode', 'code'],
  ['code', 'code'],
  ['linkReference', 'a'],
  ['*', '*'],
]);

type ScopeFn = (p: string) => boolean | undefined;
const orFunc =
  (fn: ScopeFn, fn2: ScopeFn): ScopeFn =>
  (p) =>
    fn(p) || fn2(p);

const isDangerous: ScopeFn = (p) => domEventHandlers.has(p);
const isGlobal: ScopeFn = (p) =>
  htmlElementAttributes['*']?.includes(p) ||
  /^aria-[a-z][a-z.\-_\d]*$/.test(p) ||
  /^data-[a-z][a-z_.\-0-9]*$/.test(p);

/**
 * Filter attributes based on scope configuration.
 * Ported from old remark-attr.
 */
function filteredAttributes(
  attrs: Record<string, string>,
  { scope, extend, allowDangerousDOMEventHandlers }: Config,
  htmlTag: string,
): Record<string, string> {
  let inScope: ScopeFn = () => false;
  switch (scope) {
    case 'none':
      break;

    case 'permissive':
    case 'every':
      inScope = allowDangerousDOMEventHandlers
        ? () => true
        : (p) => !isDangerous(p);
      break;

    case 'extended':
    default: {
      const extendTag = (
        extend && typeof extend === 'object' ? Object.keys(extend) : []
      ).reduce((acc, p) => {
        acc[convTypeTag.get(p) ?? p] = extend[p] ?? [];
        return acc;
      }, {} as Record<string, string[]>);
      inScope = (p) =>
        extendTag[htmlTag]?.includes(p) || extendTag['*']?.includes(p);
    }
    // Falls through
    case 'specific':
      inScope = orFunc(
        inScope,
        (p) =>
          htmlTag in htmlElementAttributes &&
          htmlElementAttributes[htmlTag]?.includes(p),
      );
    // Falls through
    case 'global':
      inScope = orFunc(inScope, isGlobal);
      if (allowDangerousDOMEventHandlers) {
        inScope = orFunc(inScope, isDangerous);
      }
  }

  return Object.fromEntries(
    Object.entries(attrs)
      .map(([p, v]): [string, string] =>
        ['key', 'class', 'id'].includes(p) ? [p, v] : [p, v ?? ''],
      )
      .filter(([p]) => inScope(p)),
  );
}

/**
 * Assign attributes to a node as `data.hProperties`, with filtering.
 */
function assignAttributes(
  node: mdast.Nodes,
  attrs: Record<string, string>,
  config: Config,
): void {
  const filtered = Object.entries(
    filteredAttributes(attrs, config, convTypeTag.get(node.type) ?? '*'),
  );
  // No filtered attributes: keep node.data/node.data.hProperties as-is
  if (filtered.length === 0) {
    return;
  }

  const data = node.data ?? (node.data = {});
  data.hProperties = filtered.reduce((props, [key, value]) => {
    props[key] =
      key === 'class' && props[key] ? props[key] + ' ' + value : value;
    return props;
  }, data.hProperties ?? {});
}
