import type { AnyPlugin } from '../utils.js';

/**
 * Attribute syntax (`{#id .class key=value}`) slot.
 *
 * Until VFM 2.x this slot held remark-attr 0.11, which patches the remark-parse
 * 8 parser. remark-parse 11 has no parser class to patch and remark-attr
 * throws when it is missing, so the slot is a no-op for now and attribute
 * blocks stay in the text.
 * @todo Replace with the VFM attribute extension (#288).
 */
export const mdast: AnyPlugin = () => undefined;
