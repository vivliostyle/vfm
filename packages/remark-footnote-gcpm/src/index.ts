/**
 * GCPM-style inline footnote plugin.
 *
 * Emits `<span class="footnote">` elements at the call site (per
 * css-gcpm-3 §3 footnotes). Duplicate references to the same definition
 * become `<a class="footnote-duplicated-call">` pointing at the original
 * footnote span.
 */

import {
  buildElement,
  type ElementFactory as FootnoteFactory,
  HastPropertiesSchema,
  type TagAwareH,
} from '@vivliostyle/vfm-internal-utils';
import type * as hast from 'hast';
import { h } from 'hastscript';
import {
  type Handler as ToHastHandler,
  all as convertToHast,
} from 'mdast-util-to-hast';
import type unified from 'unified';
import * as v from 'valibot';

export type { ElementFactory as FootnoteFactory } from '@vivliostyle/vfm-internal-utils';

// ---------------------------------------------------------------------------
// GCPM-specific types and schemas
// ---------------------------------------------------------------------------

export type GcpmBodyFactory = FootnoteFactory<
  'span',
  { id: `fn-${string}`; role: 'doc-footnote' }
>;

export type GcpmDuplicatedCallFactory = FootnoteFactory<
  'a',
  {
    href: `#fn-${string}`;
    class: 'footnote-duplicated-call';
    role: 'doc-noteref';
  }
>;

const gcpmBodySchema = v.union([
  HastPropertiesSchema,
  v.pipe(
    v.function() as v.GenericSchema<GcpmBodyFactory>,
    v.metadata({ typeString: 'GcpmBodyFactory' }),
  ),
]);

const gcpmDuplicatedCallSchema = v.union([
  HastPropertiesSchema,
  v.pipe(
    v.function() as v.GenericSchema<GcpmDuplicatedCallFactory>,
    v.metadata({ typeString: 'GcpmDuplicatedCallFactory' }),
  ),
]);

export const GcpmFootnoteOptionsSchema = v.object({
  mode: v.literal('gcpm'),
  body: v.optional(gcpmBodySchema),
  duplicatedCall: v.optional(gcpmDuplicatedCallSchema),
});

export type GcpmFootnoteOptions = v.InferInput<
  typeof GcpmFootnoteOptionsSchema
>;

/**
 * YAML-safe variant: `body` and `duplicatedCall` accept `hast.Properties`
 * only, since YAML cannot represent JavaScript functions.
 */
export const GcpmYamlFootnoteOptionsSchema = v.object({
  mode: v.literal('gcpm'),
  body: v.optional(HastPropertiesSchema),
  duplicatedCall: v.optional(HastPropertiesSchema),
});

export type GcpmYamlFootnoteOptions = v.InferInput<
  typeof GcpmYamlFootnoteOptionsSchema
>;

// ---------------------------------------------------------------------------
// GCPM handlers
// ---------------------------------------------------------------------------

type BuildFootnote = (
  id: `fn-${string}`,
  children: hast.ElementContent[],
) => hast.Element;

const createBuildFootnote =
  (factory: GcpmBodyFactory): BuildFootnote =>
  (id, children) => {
    const result = factory(
      h as TagAwareH,
      { id, role: 'doc-footnote' as const },
      children,
    );
    result.tagName = 'span';
    return result;
  };

type BuildDuplicatedCall = (targetId: `fn-${string}`) => hast.Element;

const createBuildDuplicatedCall =
  (
    customizer: hast.Properties | GcpmDuplicatedCallFactory | undefined,
  ): BuildDuplicatedCall =>
  (targetId) =>
    buildElement(
      'a',
      {
        href: `#${targetId}`,
        class: 'footnote-duplicated-call',
        role: 'doc-noteref',
      } as {
        href: `#fn-${string}`;
        class: 'footnote-duplicated-call';
        role: 'doc-noteref';
      },
      [],
      customizer,
    );

const createInlineFootnoteHandler =
  (buildFootnote: BuildFootnote): ToHastHandler =>
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
    return buildFootnote(`fn-${identifier}`, convertToHast(ctx, node));
  };

const createFootnoteReferenceHandler = (
  buildFootnote: BuildFootnote,
  buildDuplicatedCall: BuildDuplicatedCall,
): ToHastHandler => {
  const seen = new Set<string>();
  return (ctx, node) => {
    const identifier = String(node.identifier);
    const def = ctx.footnoteById[identifier.toUpperCase()];
    if (!def) {
      return null;
    }

    if (seen.has(identifier)) {
      return buildDuplicatedCall(`fn-${identifier}`);
    }

    seen.add(identifier);
    return buildFootnote(
      `fn-${identifier}`,
      convertToHast(
        ctx,
        // Unwrap single-paragraph definitions to produce inline content
        // (matches tight list-item behavior in footer.js).
        def.children[0]?.type === 'paragraph' ? def.children[0] : def,
      ),
    );
  };
};

// ---------------------------------------------------------------------------
// Plugin entrypoint
// ---------------------------------------------------------------------------

export type GcpmFootnotePlugin = {
  toHastHandlers: {
    footnoteDefinition: undefined;
    footnoteReference: ToHastHandler;
    footnote: ToHastHandler;
  };
  hastTransformer: unified.Plugin;
};

const noopPlugin: unified.Plugin = () => () => {};

export const createGcpmFootnotePlugin = (
  options: Partial<GcpmFootnoteOptions> = { mode: 'gcpm' },
): GcpmFootnotePlugin => {
  const body = options.body;
  const buildFootnote = createBuildFootnote(
    typeof body === 'function'
      ? body
      : typeof body === 'object'
        ? (((hFn, props, children) =>
            hFn('span', { ...props, ...body }, ...children)) as GcpmBodyFactory)
        : (((hFn, props, children) =>
            hFn(
              'span',
              { class: 'footnote', ...props },
              ...children,
            )) as GcpmBodyFactory),
  );
  const buildDuplicatedCall = createBuildDuplicatedCall(options.duplicatedCall);

  return {
    toHastHandlers: {
      footnoteDefinition: undefined,
      footnoteReference: createFootnoteReferenceHandler(
        buildFootnote,
        buildDuplicatedCall,
      ),
      footnote: createInlineFootnoteHandler(buildFootnote),
    },
    hastTransformer: noopPlugin,
  };
};
