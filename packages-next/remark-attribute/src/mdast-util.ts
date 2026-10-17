import { htmlElementAttributes } from 'html-element-attributes';
import type {
  Data,
  Heading,
  Node as MdastNode,
  Nodes,
  Parents,
  PhrasingContent,
  Root,
  RootContent,
  Text,
} from 'mdast';
import type {
  CompileContext,
  Extension,
  Token,
} from 'mdast-util-from-markdown';
// Registers `hProperties` on mdast `Data`.
import type {} from 'mdast-util-to-hast';
import { parseEntities } from 'parse-entities';
import { visitParents } from 'unist-util-visit-parents';

declare module 'mdast-util-from-markdown' {
  interface CompileData {
    /** Attributes of the list being parsed, in source order. */
    attributeList?: Array<[string, string]> | undefined;
  }
}

/** Attribute list written inline, before it is attached to its target. */
export interface AttributeInline extends MdastNode {
  type: 'attributeInline';
  /** Parsed attributes. Classes are joined with a space. */
  attributes: Record<string, string>;
  /** Source text of the list, used when it attaches to nothing. */
  raw: string;
}

/** Attribute list alone on its line, before it is attached to its target. */
export interface AttributeBlock extends MdastNode {
  type: 'attributeBlock';
  /** Parsed attributes. Classes are joined with a space. */
  attributes: Record<string, string>;
  /** Source text of the list, used when it attaches to nothing. */
  raw: string;
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

/** Scope of attribute names that are kept, following remark-attr. */
export type Scope =
  | 'none'
  | 'global'
  | 'specific'
  | 'extended'
  | 'permissive'
  | 'every';

export interface Options {
  /** Keep `on*` DOM event handler attributes (default `false`). */
  allowDangerousDOMEventHandlers?: boolean | undefined;
  /** Extra attribute names per mdast node type (or `'*'`), for `extended`. */
  extend?: Record<string, string[]> | undefined;
  /** Which attribute names are kept (default `'extended'`). */
  scope?: Scope | undefined;
  /** Attach a trailing attribute list to its heading (default `true`). */
  enableAtxHeaderInline?: boolean | undefined;
  /** Ignore attribute lists alone on their line (default `false`). */
  disableBlockElements?: boolean | undefined;
}

/** `data.hProperties` as declared by `mdast-util-to-hast`. */
type HProperties = NonNullable<Data['hProperties']>;

interface Config {
  allowDangerousDOMEventHandlers: boolean;
  extend: Record<string, string[]>;
  scope: Scope;
  enableAtxHeaderInline: boolean;
  disableBlockElements: boolean;
}

/**
 * Create the `enter` handler of an attribute list: open the node and start
 * collecting attributes.
 * @param type - Node type to create.
 * @returns Handler.
 */
const enterAttributes = (type: 'attributeInline' | 'attributeBlock') =>
  function (this: CompileContext, token: Token): undefined {
    this.data.attributeList = [];
    this.enter({ type, attributes: {}, raw: '' }, token);
  };

/**
 * Record an `#id` shortcut.
 * @param token - The id value token.
 */
function exitAttributeIdValue(this: CompileContext, token: Token): undefined {
  this.data.attributeList?.push([
    'id',
    parseEntities(this.sliceSerialize(token), { attribute: true }),
  ]);
}

/**
 * Record a `.class` shortcut.
 * @param token - The class value token.
 */
function exitAttributeClassValue(
  this: CompileContext,
  token: Token,
): undefined {
  this.data.attributeList?.push([
    'class',
    parseEntities(this.sliceSerialize(token), { attribute: true }),
  ]);
}

/**
 * Record an attribute name. The value, if any, is filled in by
 * {@link exitAttributeValue}.
 * @param token - The name token.
 */
function exitAttributeName(this: CompileContext, token: Token): undefined {
  this.data.attributeList?.push([this.sliceSerialize(token), '']);
}

/**
 * Record the value of the last attribute name.
 * @param token - The value token.
 */
function exitAttributeValue(this: CompileContext, token: Token): undefined {
  const last = this.data.attributeList?.at(-1);
  if (last) {
    last[1] = parseEntities(this.sliceSerialize(token), { attribute: true });
  }
}

/**
 * Turn the recorded attribute pairs into a map, joining classes with a space.
 * @param list - Attribute pairs in source order.
 * @returns Attribute map.
 */
const cleanAttributes = (list: Array<[string, string]>) =>
  list.reduce<Record<string, string>>((cleaned, [key, value]) => {
    if (key === 'class' && cleaned.class) {
      cleaned.class += ' ' + value;
    } else {
      cleaned[key] = value;
    }
    return cleaned;
  }, {});

/**
 * Create the `exit` handler of an attribute list: store the attributes and
 * the source text, then close the node.
 * @param type - Node type being closed.
 * @returns Handler.
 */
const exitAttributes = (type: 'attributeInline' | 'attributeBlock') =>
  function (this: CompileContext, token: Token): undefined {
    const list = this.data.attributeList;
    this.data.attributeList = undefined;
    const node = this.stack[this.stack.length - 1];
    if (node && node.type === type) {
      node.attributes = cleanAttributes(list ?? []);
      node.raw = this.sliceSerialize(token);
    }
    this.exit(token);
  };

/** Blocks a block attribute list may attach to. */
const isBlockTarget = (node: RootContent): boolean =>
  node.type === 'heading' || node.type === 'code';

/**
 * Whether `attribute` starts on the line right after `target` ends. Block
 * attributes only attach to the block they directly follow.
 * @param target - Candidate target.
 * @param attribute - Attribute block.
 * @returns `true` when adjacent.
 */
const isAdjacent = (target: RootContent, attribute: AttributeBlock): boolean =>
  target.position !== undefined &&
  attribute.position !== undefined &&
  attribute.position.start.line === target.position.end.line + 1;

/**
 * Turn an unattached attribute block back into a paragraph with its source
 * text.
 * @param node - Attribute block.
 * @returns Paragraph.
 */
const fallbackParagraph = (node: AttributeBlock): RootContent => ({
  type: 'paragraph',
  children: [{ type: 'text', value: node.raw, position: node.position }],
  position: node.position,
});

/**
 * Attach block attribute lists to the heading or fenced code they directly
 * follow; others (and all of them when `disableBlockElements` is set) become
 * paragraphs again.
 * @param tree - Root.
 * @param config - Resolved options.
 */
function handleBlockAttributes(tree: Root, config: Config): void {
  for (let index = tree.children.length - 1; index >= 0; index--) {
    const node = tree.children[index];
    if (!node || node.type !== 'attributeBlock') {
      continue;
    }
    const target = index > 0 ? tree.children[index - 1] : undefined;
    if (
      !config.disableBlockElements &&
      target &&
      isBlockTarget(target) &&
      isAdjacent(target, node)
    ) {
      assignAttributes(target, node.attributes, config);
      tree.children.splice(index, 1);
    } else {
      tree.children[index] = fallbackParagraph(node);
    }
  }
}

/** Phrasing content parents whose children may hold inline attribute lists. */
const hasPhrasingChildren = (node: Nodes): node is Parents =>
  node.type === 'paragraph' ||
  node.type === 'heading' ||
  node.type === 'link' ||
  node.type === 'emphasis' ||
  node.type === 'strong' ||
  node.type === 'delete' ||
  node.type === 'linkReference' ||
  node.type === 'tableCell';

/** Inline nodes an inline attribute list may attach to. */
const isInlineTarget = (node: PhrasingContent): boolean =>
  node.type === 'strong' ||
  node.type === 'emphasis' ||
  node.type === 'link' ||
  node.type === 'image' ||
  node.type === 'inlineCode' ||
  node.type === 'delete' ||
  node.type === 'linkReference' ||
  node.type === 'imageReference' ||
  node.type === 'footnoteReference';

/**
 * Whether a phrasing node is whitespace-only text.
 * @param node - Node to test.
 * @returns `true` for empty or whitespace text.
 */
const isBlankText = (node: PhrasingContent | undefined): boolean =>
  node !== undefined && node.type === 'text' && node.value.trim() === '';

/**
 * Attach an attribute list that ends a heading to the heading itself
 * (`# Title {.class}`), removing it and trailing whitespace from the text.
 * A heading that holds nothing else keeps the list as text.
 * @param heading - Heading.
 * @param index - Index of the attribute list in the heading's children.
 * @param config - Resolved options.
 * @returns `true` when the list was attached.
 */
function attachToHeading(
  heading: Heading,
  index: number,
  config: Config,
): boolean {
  const attribute = heading.children[index];
  if (!attribute || attribute.type !== 'attributeInline') return false;

  const after = heading.children.slice(index + 1);
  if (!after.every(isBlankText)) return false;

  const before = heading.children.slice(0, index);
  if (before.every(isBlankText)) return false;

  assignAttributes(heading, attribute.attributes, config);
  heading.children.splice(index);
  const last = heading.children[heading.children.length - 1];
  if (last && last.type === 'text') {
    last.value = last.value.replace(/\s+$/, '');
    if (last.value === '') heading.children.pop();
  }
  return true;
}

/**
 * Turn an unattached inline attribute list back into its source text.
 * @param node - Attribute list.
 * @returns Text node.
 */
const fallbackText = (node: AttributeInline): Text => ({
  type: 'text',
  value: node.raw,
  position: node.position,
});

/**
 * Attach inline attribute lists to the node right before them, or to the
 * heading they end; others become text again.
 * @param tree - Root.
 * @param config - Resolved options.
 */
function handleInlineAttributes(tree: Root, config: Config): void {
  visitParents(tree, (node) => {
    if (!hasPhrasingChildren(node)) return;
    const children = node.children as PhrasingContent[];

    for (let index = children.length - 1; index >= 0; index--) {
      const child = children[index];
      if (!child || child.type !== 'attributeInline') continue;

      if (
        node.type === 'heading' &&
        config.enableAtxHeaderInline &&
        attachToHeading(node, index, config)
      ) {
        continue;
      }

      const target = index > 0 ? children[index - 1] : undefined;
      if (target && isInlineTarget(target)) {
        assignAttributes(target, child.attributes, config);
        children.splice(index, 1);
      } else {
        children[index] = fallbackText(child);
      }
    }
  });
}

/**
 * Create the tree transform that attaches attribute lists to their targets.
 * @param config - Resolved options.
 * @returns Transform.
 */
const transformAttributes = (config: Config) => (tree: Root) => {
  handleBlockAttributes(tree, config);
  handleInlineAttributes(tree, config);
};

/**
 * Create the `mdast-util-from-markdown` extension that turns attribute list
 * tokens into attributes (`data.hProperties`) of their targets.
 * @param options - Options.
 * @returns Extension to register on a remark processor
 *   (`fromMarkdownExtensions`).
 */
export function attributeFromMarkdown(
  options?: Readonly<Options> | null | undefined,
): Extension {
  const config: Config = {
    allowDangerousDOMEventHandlers:
      options?.allowDangerousDOMEventHandlers ?? false,
    extend: options?.extend ?? {},
    scope: options?.scope ?? 'extended',
    enableAtxHeaderInline: options?.enableAtxHeaderInline ?? true,
    disableBlockElements: options?.disableBlockElements ?? false,
  };

  return {
    enter: {
      inlineAttributes: enterAttributes('attributeInline'),
      blockAttributes: enterAttributes('attributeBlock'),
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
    },
    transforms: [transformAttributes(config)],
  };
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

/** mdast node type to the HTML tag name used for scope filtering. */
const tagNames: ReadonlyMap<string, string> = new Map([
  ['image', 'img'],
  ['imageReference', 'img'],
  ['link', 'a'],
  ['linkReference', 'a'],
  ['footnoteReference', 'a'],
  ['heading', 'h1'],
  ['strong', 'strong'],
  ['emphasis', 'em'],
  ['delete', 's'],
  ['inlineCode', 'code'],
  ['code', 'code'],
]);

type NameFilter = (name: string) => boolean;

/**
 * Combine two filters with "or".
 * @param a - First filter.
 * @param b - Second filter.
 * @returns Filter that accepts what either accepts.
 */
const either =
  (a: NameFilter, b: NameFilter): NameFilter =>
  (name) =>
    a(name) || b(name);

/**
 * Whether an attribute name is a DOM event handler.
 * @param name - Attribute name.
 * @returns `true` for `on*` handlers.
 */
const isDangerous: NameFilter = (name) => domEventHandlers.has(name);

/**
 * Whether an attribute name is a global attribute, `aria-*` or `data-*`.
 * @param name - Attribute name.
 * @returns `true` when global.
 */
const isGlobal: NameFilter = (name) =>
  (htmlElementAttributes['*']?.includes(name) ?? false) ||
  /^aria-[a-z][a-z.\-_\d]*$/.test(name) ||
  /^data-[a-z][a-z_.\-0-9]*$/.test(name);

/**
 * Build the attribute-name filter for a node, following remark-attr's scopes.
 * @param config - Resolved options.
 * @param nodeType - mdast node type of the target.
 * @returns Filter.
 */
function nameFilter(config: Config, nodeType: string): NameFilter {
  const { scope, extend, allowDangerousDOMEventHandlers } = config;
  const tagName = tagNames.get(nodeType) ?? '*';
  /** Filter built up by the fall-through cases below; starts by rejecting all. */
  let inScope: NameFilter = () => false;

  switch (scope) {
    case 'none':
      return inScope;

    case 'permissive':
    case 'every':
      return allowDangerousDOMEventHandlers
        ? () => true
        : (name) => !isDangerous(name);

    case 'extended': {
      const extendByTag = Object.fromEntries(
        Object.entries(extend).map(([type, names]) => [
          tagNames.get(type) ?? type,
          names,
        ]),
      );
      inScope = (name) =>
        (extendByTag[tagName]?.includes(name) ?? false) ||
        (extendByTag['*']?.includes(name) ?? false);
    }
    // Falls through
    case 'specific':
      inScope = either(
        inScope,
        (name) => htmlElementAttributes[tagName]?.includes(name) ?? false,
      );
    // Falls through
    case 'global':
      inScope = either(inScope, isGlobal);
      if (allowDangerousDOMEventHandlers) {
        inScope = either(inScope, isDangerous);
      }
  }
  return inScope;
}

/**
 * Write attributes to `data.hProperties` of a node, keeping only the names
 * the scope allows and merging classes.
 * @param node - Target node.
 * @param attributes - Attributes to write.
 * @param config - Resolved options.
 */
function assignAttributes(
  node: Nodes,
  attributes: Record<string, string>,
  config: Config,
): void {
  const allowed = nameFilter(config, node.type);
  const entries = Object.entries(attributes).filter(([name]) => allowed(name));
  if (entries.length === 0) {
    return;
  }
  const data = (node.data ??= {});
  const properties: HProperties = { ...(data.hProperties ?? {}) };
  for (const [name, value] of entries) {
    const current = properties[name];
    properties[name] =
      name === 'class' && typeof current === 'string'
        ? `${current} ${value}`
        : value;
  }
  data.hProperties = properties;
}
