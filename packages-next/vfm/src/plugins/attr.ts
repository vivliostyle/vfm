import { mdast as attribute } from '@vivliostyle/remark-attribute-next';
import { type AnyPlugin, partial } from '../utils.js';

/**
 * Attribute syntax slot (`{#id .class key=value}`).
 *
 * `scope: 'permissive'` keeps every attribute except DOM event handlers, and a
 * trailing list on a heading line applies to the heading, as remark-attr was
 * configured in VFM 2.x. Fenced code attributes are read from `code.meta` by
 * the code plugin instead.
 */
export const mdast: AnyPlugin = partial(attribute, {
  scope: 'permissive',
  enableAtxHeaderInline: true,
}) as AnyPlugin;
