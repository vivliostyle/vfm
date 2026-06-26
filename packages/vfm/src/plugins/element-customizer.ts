/**
 * Generic machinery for customizing a generated hast element via a
 * Properties-or-Factory customizer. Extracted from the footnote plugin so the
 * same customization model can be reused by other plugins (e.g. table cells).
 */

import type * as hast from 'hast';
import {
  h,
  type Properties as HProperties,
  type Child as HChild,
} from 'hastscript';
import * as v from 'valibot';

/**
 * Extract the tag name from a hastscript CSS selector string.
 * hastscript recognizes only `#` and `.` as selector shorthand delimiters.
 *
 * - `"aside"` → `"aside"`
 * - `"aside.foo"` → `"aside"`
 * - `".foo"` → `ShorthandTagName` (implicit div, distinguished from explicit `"div"`)
 * - `""` → `ShorthandTagName`
 *
 * @see https://github.com/syntax-tree/hast-util-parse-selector/blob/3.1.1/lib/index.js#L6
 */
type ExtractTagName<S extends string> = S extends `${infer Tag}${
  | '.'
  | '#'}${string}`
  ? Tag extends ''
    ? ShorthandTagName
    : Tag
  : S extends ''
    ? ShorthandTagName
    : S;

const shorthandTagBrand = Symbol();

/**
 * Branded `"div"` produced when hastscript receives a tag-less shorthand
 * selector (e.g. `".foo"`).  Distinguished from an explicit `"div"` so that
 * {@link ElementFactory} can accept shorthand at the top level while
 * rejecting an explicit wrong tag name.
 */
type ShorthandTagName = 'div' & { [shorthandTagBrand]: unknown };

/**
 * Tag-aware `h` function passed to {@link ElementFactory}.
 * Accepts any selector freely (enabling child element creation with
 * arbitrary tags), but preserves the tag name extracted from the selector
 * in the return type.
 */
export type TagAwareH = {
  <S extends string>(
    selector: S,
    properties?: HProperties,
    ...children: HChild[]
  ): hast.Element & { tagName: ExtractTagName<S> };
  <S extends string>(
    selector: S,
    ...children: HChild[]
  ): hast.Element & {
    tagName: ExtractTagName<S>;
  };
};

/**
 * Factory that customizes a generated hast element.
 *
 * The `h` parameter is a {@link TagAwareH} that accepts any selector
 * (including child-element creation like `h('span.wrap', ...)`), but
 * the return type must have `tagName` matching `TTag` or
 * {@link ShorthandTagName} (tag-less shorthand like `".foo"`).
 * Only a tag-less shorthand selector (whose runtime tag is a bare `div`)
 * has its `tagName` substituted by the caller; an explicitly named tag is
 * preserved. For a union `TTag` such as `'th' | 'td'` this lets the factory
 * own which member it builds (typically from caller-provided context).
 *
 * @template TTag The expected root tag name.
 * @template TProps Structural properties provided by the caller.
 * @template TChildren Children tuple provided by the caller.
 */
export type ElementFactory<
  TTag extends string,
  TProps,
  TChildren extends hast.ElementContent[] = hast.ElementContent[],
> = (
  h: TagAwareH,
  properties: TProps,
  children: TChildren,
) => hast.Element & { tagName: TTag | ShorthandTagName };

/**
 * Build a hast element by applying a Properties-or-Factory customizer.
 * The caller provides the fixed `tagName` and `structuralProps`;
 * user-supplied Properties are spread after structural ones (user wins).
 * For a Factory, the factory's returned element is used as-is. The caller's
 * `tagName` is substituted only when the factory used a tag-less shorthand
 * selector (whose runtime tag is a bare `div`); an explicitly named tag is
 * left untouched.
 */
export const buildElement = <
  TTag extends string,
  TProps extends hast.Properties,
  TChildren extends hast.ElementContent[] = hast.ElementContent[],
>(
  tagName: TTag,
  structuralProps: TProps,
  children: TChildren,
  customizer:
    | hast.Properties
    | ElementFactory<TTag, TProps, TChildren>
    | undefined,
): hast.Element => {
  if (typeof customizer === 'function') {
    const result = customizer(h as TagAwareH, structuralProps, children);
    // hastscript renders a tag-less shorthand selector (e.g. `h('.foo')`) as a
    // bare `div`; substitute the caller's intended tag in that case. An
    // explicitly named tag is preserved. For a union `TTag` like `'th' | 'td'`
    // this lets a per-cell hook decide the tag from context, and a hardcoded
    // wrong tag surfaces instead of being silently rewritten. Explicit `div` is
    // unreachable at the type level: it is not assignable to
    // `TTag | ShorthandTagName` for any current caller, so a `div` here can
    // only be shorthand.
    if (result.tagName === 'div') result.tagName = tagName;
    return result;
  }
  if (typeof customizer === 'object') {
    return h(tagName, { ...structuralProps, ...customizer }, ...children);
  }
  return h(tagName, structuralProps, ...children);
};

/** valibot schema accepting any plain (non-array) object as hast Properties. */
export const HastPropertiesSchema = v.pipe(
  v.custom<hast.Properties>(
    (input) =>
      typeof input === 'object' && input !== null && !Array.isArray(input),
  ),
  v.metadata({ typeString: 'import("hast").Properties' }),
);
