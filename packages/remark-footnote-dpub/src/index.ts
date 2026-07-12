/**
 * DPUB-ARIA inline footnote plugin.
 *
 * Emits `<a role="doc-noteref">` calls and queues `<aside role="doc-footnote">`
 * bodies that the hast transformer inserts after each footnote definition's
 * position (or after the call site's nearest non-flow-container ancestor for
 * inline footnotes). Reference numbers are renumbered against the document
 * order of call sites in a final pass.
 */

import {
  buildElement,
  type ElementFactory as FootnoteFactory,
  HastPropertiesSchema,
} from '@vivliostyle/vfm-internal-utils';
import type * as hast from 'hast';
import { selectAll } from 'hast-util-select';
import { h } from 'hastscript';
import {
  type Handler as ToHastHandler,
  all as convertToHast,
} from 'mdast-util-to-hast';
import type unified from 'unified';
import type * as unist from 'unist';
import { u } from 'unist-builder';
import * as v from 'valibot';

export type { ElementFactory as FootnoteFactory } from '@vivliostyle/vfm-internal-utils';

type ElementWithProps = hast.Element & {
  properties: NonNullable<hast.Element['properties']>;
};

// ---------------------------------------------------------------------------
// DPUB-specific types and schemas
// ---------------------------------------------------------------------------

/** Backlink element placed at the head of a DPUB footnote body. */
type DpubBacklink = hast.Element & {
  tagName: 'a';
  children: [
    hast.Element & {
      tagName: 'sup';
      children: [hast.Text & { value: `${number}` }];
    },
  ];
  properties: {
    href: `#fnref${number}`;
    className: ['footnote-back'];
    role: 'doc-backlink';
  };
};

/** Children tuple passed to DPUB body factory / buildElement. */
export type DpubBodyChildren = [DpubBacklink, ...hast.ElementContent[]];

/** Sup element wrapping the reference number in a DPUB noteref. */
type DpubCallSup = hast.Element & {
  tagName: 'sup';
  children: [hast.Text & { value: `${number}` }];
};

/** Children tuple passed to DPUB call factory / buildElement. */
export type DpubCallChildren = [DpubCallSup];

export type DpubCallFactory = FootnoteFactory<
  'a',
  {
    id: `fnref${number}`;
    href: `#fn${number}`;
    class: 'footnote-ref';
    role: 'doc-noteref';
  },
  DpubCallChildren
>;

export type DpubBodyFactory = FootnoteFactory<
  'aside',
  { id: `fn${number}`; class: 'footnote'; role: 'doc-footnote' },
  DpubBodyChildren
>;

const dpubCallSchema = v.union([
  HastPropertiesSchema,
  v.pipe(
    v.function() as v.GenericSchema<DpubCallFactory>,
    v.metadata({ typeString: 'DpubCallFactory' }),
  ),
]);

const dpubBodySchema = v.union([
  HastPropertiesSchema,
  v.pipe(
    v.function() as v.GenericSchema<DpubBodyFactory>,
    v.metadata({ typeString: 'DpubBodyFactory' }),
  ),
]);

export const DpubFootnoteOptionsSchema = v.object({
  mode: v.literal('dpub'),
  call: v.optional(dpubCallSchema),
  body: v.optional(dpubBodySchema),
});

export type DpubFootnoteOptions = v.InferInput<
  typeof DpubFootnoteOptionsSchema
>;

/**
 * YAML-safe variant: `call` and `body` accept `hast.Properties` only,
 * since YAML cannot represent JavaScript functions.
 */
export const DpubYamlFootnoteOptionsSchema = v.object({
  mode: v.literal('dpub'),
  call: v.optional(HastPropertiesSchema),
  body: v.optional(HastPropertiesSchema),
});

export type DpubYamlFootnoteOptions = v.InferInput<
  typeof DpubYamlFootnoteOptionsSchema
>;

// ---------------------------------------------------------------------------
// DPUB handlers and transformer
// ---------------------------------------------------------------------------

const createDpubFootnoteReferenceHandler =
  (
    pending: Map<string, hast.Element>,
    nextIndex: () => number,
    assigned: Map<string, { refIndex: number; dupCount: number }>,
    callCustomizer: hast.Properties | DpubCallFactory | undefined,
    bodyCustomizer: hast.Properties | DpubBodyFactory | undefined,
  ): ToHastHandler =>
  (ctx, node) => {
    const identifier = String(node.identifier);
    const def = ctx.footnoteById[identifier.toUpperCase()];
    if (!def) {
      return null;
    }

    const existing = assigned.get(identifier);

    if (existing) {
      // Duplicate reference: reuse the same footnote number
      const refIndex = existing.refIndex;
      const fnId = `fn${refIndex}` as `fn${number}`;
      existing.dupCount++;
      const callId =
        `fnref${refIndex}-${existing.dupCount}` as `fnref${number}`;

      return buildElement(
        'a',
        {
          id: callId,
          href: `#${fnId}`,
          class: 'footnote-ref' as const,
          role: 'doc-noteref' as const,
        },
        [h('sup', u('text', `${refIndex}`))] as DpubCallChildren,
        callCustomizer,
      );
    }

    // First reference: assign a new number and create the aside
    const refIndex = nextIndex();
    assigned.set(identifier, { refIndex, dupCount: 0 });
    const callId = `fnref${refIndex}` as `fnref${number}`;
    const fnId = `fn${refIndex}` as `fn${number}`;

    const backlink: DpubBacklink = h(
      'a',
      { href: `#${callId}`, class: 'footnote-back', role: 'doc-backlink' },
      h('sup', u('text', `${refIndex}`)),
    ) as DpubBacklink;

    const bodyChildren: DpubBodyChildren = [
      backlink,
      ...convertToHast(
        ctx,
        def.children[0]?.type === 'paragraph' ? def.children[0] : def,
      ),
    ];

    pending.set(
      identifier,
      buildElement(
        'aside',
        { id: fnId, class: 'footnote' as const, role: 'doc-footnote' as const },
        bodyChildren,
        bodyCustomizer,
      ),
    );

    return buildElement(
      'a',
      {
        id: callId,
        href: `#${fnId}`,
        class: 'footnote-ref' as const,
        role: 'doc-noteref' as const,
      },
      [h('sup', u('text', `${refIndex}`))] as DpubCallChildren,
      callCustomizer,
    );
  };

const createDpubInlineFootnoteHandler =
  (
    inlinePending: Map<string, hast.Element>,
    nextIndex: () => number,
    callCustomizer: hast.Properties | DpubCallFactory | undefined,
    bodyCustomizer: hast.Properties | DpubBodyFactory | undefined,
  ): ToHastHandler =>
  (ctx, node) => {
    let no = 1;
    while (String(no) in ctx.footnoteById) {
      no++;
    }
    const identifier = String(no);
    ctx.footnoteById[identifier] = {
      type: 'footnoteDefinition',
      identifier,
      children: [{ type: 'paragraph', children: node.children }],
      position: node.position,
    };

    const refIndex = nextIndex();
    const callId = `fnref${refIndex}` as `fnref${number}`;
    const fnId = `fn${refIndex}` as `fn${number}`;

    const backlink: DpubBacklink = h(
      'a',
      { href: `#${callId}`, class: 'footnote-back', role: 'doc-backlink' },
      h('sup', u('text', `${refIndex}`)),
    ) as DpubBacklink;

    const bodyChildren: DpubBodyChildren = [
      backlink,
      ...convertToHast(ctx, node),
    ];

    inlinePending.set(
      callId,
      buildElement(
        'aside',
        { id: fnId, class: 'footnote' as const, role: 'doc-footnote' as const },
        bodyChildren,
        bodyCustomizer,
      ),
    );

    return buildElement(
      'a',
      {
        id: callId,
        href: `#${fnId}`,
        class: 'footnote-ref' as const,
        role: 'doc-noteref' as const,
      },
      [h('sup', u('text', `${refIndex}`))] as DpubCallChildren,
      callCustomizer,
    );
  };

/**
 * Emit a placeholder element at the footnote definition position.
 * The default mdast-util-to-hast handler ignores footnoteDefinition nodes;
 * this override preserves the position in the hast tree so the transformer
 * can replace the placeholder with the queued aside.
 */
const createDpubFootnoteDefinitionHandler =
  (): ToHastHandler => (_ctx, node) => {
    const identifier = String(node.identifier);
    return h('div', { dataFootnotePlaceholder: identifier });
  };

/**
 * Replace definition-position placeholders with queued asides, and insert
 * inline-footnote asides after their nearest non-flow-container ancestor.
 */
const createReplaceDpubPlaceholders =
  (
    pending: Map<string, hast.Element>,
    inlinePending: Map<string, hast.Element>,
  ) =>
  () =>
  (tree: unist.Node) => {
    const root = tree as hast.Root;
    const placed = new Set<string>();

    // Phase 1: Replace placeholders with asides from reference footnotes
    function walkAndReplace(parent: hast.Element | hast.Root) {
      const newChildren: (hast.RootContent | hast.ElementContent)[] = [];
      for (const child of parent.children) {
        if (
          child.type === 'element' &&
          child.tagName === 'div' &&
          child.properties?.dataFootnotePlaceholder
        ) {
          const id = String(child.properties.dataFootnotePlaceholder);
          const aside = pending.get(id);
          if (aside) {
            newChildren.push(aside);
            placed.add(id);
          }
          // Unreferenced definition: drop placeholder
          continue;
        }
        newChildren.push(child);
        if (child.type === 'element') {
          walkAndReplace(child);
        }
      }
      parent.children = newChildren;
    }

    walkAndReplace(root);

    // Phase 2: Insert inline footnote asides after nearest non-flow-container
    if (inlinePending.size > 0) {
      const remaining = new Set(inlinePending.keys());

      const containsCall = (
        node: hast.RootContent | hast.ElementContent,
      ): string[] => {
        if (remaining.size === 0 || node.type !== 'element') {
          return [];
        }
        const id = node.properties?.id;
        return [
          ...(typeof id === 'string' && remaining.has(id) ? [id] : []),
          ...node.children.flatMap((child) => containsCall(child)),
        ];
      };

      const processParent = (parent: hast.Element | hast.Root) => {
        const newChildren: (hast.RootContent | hast.ElementContent)[] = [];
        for (const child of parent.children) {
          newChildren.push(child);
          if (child.type !== 'element') {
            continue;
          }
          if (flowContainerTagNames.has(child.tagName)) {
            processParent(child);
          } else {
            for (const callId of containsCall(child)) {
              const aside = inlinePending.get(callId);
              if (aside) {
                newChildren.push(aside);
                remaining.delete(callId);
              }
            }
          }
        }
        parent.children = newChildren;
      };

      processParent(root);

      for (const callId of remaining) {
        const aside = inlinePending.get(callId);
        if (aside) {
          root.children.push(aside);
        }
      }
    }

    // Phase 3: Renumber refIndex based on DOM order of calls.
    //
    // The footnote handlers assign refIndex at handler-invocation time,
    // which mdast-util-to-hast <12.1.1 walks in reverse inside table
    // cells (issue #129).  Now that the tree is fully built, rewrite
    // every fnref${N}[-${dup}] / fn${N} using a mapping derived from
    // the document order of call sites.  When the upstream walker is
    // already fixed this mapping is the identity, making the pass a
    // no-op.
    const oldToNewRefIndex = new Map<number, number>();
    let newCounter = 0;

    (selectAll('a.footnote-ref', root) as ElementWithProps[]).forEach(
      (anchor) => {
        const callId = String(anchor.properties.id ?? '');
        const match = /^fnref(\d+)(?:-(\d+))?$/.exec(callId);
        if (!match) return;
        const oldRefIndex = Number(match[1]);
        const dupSuffix = match[2];

        if (!oldToNewRefIndex.has(oldRefIndex)) {
          newCounter++;
          oldToNewRefIndex.set(oldRefIndex, newCounter);
        }
        const newRefIndex = oldToNewRefIndex.get(oldRefIndex) as number;

        anchor.properties.id =
          dupSuffix === undefined
            ? `fnref${newRefIndex}`
            : `fnref${newRefIndex}-${dupSuffix}`;
        anchor.properties.href = `#fn${newRefIndex}`;
        const sup = anchor.children.find(
          (c): c is hast.Element => c.type === 'element' && c.tagName === 'sup',
        );
        if (sup && sup.children[0]?.type === 'text') {
          sup.children[0].value = String(newRefIndex);
        }
      },
    );

    (
      selectAll('aside[role="doc-footnote"]', root) as ElementWithProps[]
    ).forEach((aside) => {
      const id = String(aside.properties.id ?? '');
      const match = /^fn(\d+)$/.exec(id);
      if (!match) return;
      const oldRefIndex = Number(match[1]);
      const newRefIndex = oldToNewRefIndex.get(oldRefIndex);
      if (newRefIndex === undefined) return;

      aside.properties.id = `fn${newRefIndex}`;

      const backlink = aside.children.find((c): c is hast.Element => {
        if (c.type !== 'element' || c.tagName !== 'a') return false;
        const className = c.properties?.className;
        return (
          Array.isArray(className) &&
          (className as unknown[]).includes('footnote-back')
        );
      });
      if (backlink) {
        const oldHref = String(backlink.properties?.href ?? '');
        const backMatch = /^#fnref(\d+)(-\d+)?$/.exec(oldHref);
        if (backMatch && backlink.properties) {
          const suffix = backMatch[2] ?? '';
          backlink.properties.href = `#fnref${newRefIndex}${suffix}`;
        }
        const backSup = backlink.children.find(
          (c): c is hast.Element => c.type === 'element' && c.tagName === 'sup',
        );
        if (backSup && backSup.children[0]?.type === 'text') {
          backSup.children[0].value = String(newRefIndex);
        }
      }
    });
  };

/**
 * Elements that accept flow content as children, into which aside
 * insertion recurses to find a more precise insertion point.
 * For all other elements the aside is placed immediately after the
 * element in its parent.
 *
 * Transparent elements are included because this set is only consulted
 * from within a flow container context, so they inherit flow content
 * model from their parent.
 * @see https://html.spec.whatwg.org/multipage/dom.html#flow-content
 * @see https://html.spec.whatwg.org/multipage/dom.html#transparent-content-models
 */
const flowContainerTagNames = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
  'dd',
  'details',
  'dialog',
  'div',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'header',
  'li',
  'main',
  'nav',
  'search',
  'section',
  'td',
  'th',
  // Transparent content model
  'a',
  'audio',
  'canvas',
  'del',
  'ins',
  'map',
  'object',
  'slot',
  'video',
]);

// ---------------------------------------------------------------------------
// Plugin entrypoint
// ---------------------------------------------------------------------------

export type DpubFootnotePlugin = {
  toHastHandlers: {
    footnoteDefinition: ToHastHandler;
    footnoteReference: ToHastHandler;
    footnote: ToHastHandler;
  };
  hastTransformer: unified.Plugin;
};

export const createDpubFootnotePlugin = (
  options: Partial<DpubFootnoteOptions> = { mode: 'dpub' },
): DpubFootnotePlugin => {
  const pending = new Map<string, hast.Element>();
  const inlinePending = new Map<string, hast.Element>();
  const assigned = new Map<string, { refIndex: number; dupCount: number }>();
  let counter = 0;
  const nextIndex = () => ++counter;
  return {
    toHastHandlers: {
      footnoteDefinition: createDpubFootnoteDefinitionHandler(),
      footnoteReference: createDpubFootnoteReferenceHandler(
        pending,
        nextIndex,
        assigned,
        options.call,
        options.body,
      ),
      footnote: createDpubInlineFootnoteHandler(
        inlinePending,
        nextIndex,
        options.call,
        options.body,
      ),
    },
    hastTransformer: createReplaceDpubPlaceholders(pending, inlinePending),
  };
};
