import { Parent as HastParent } from 'hast';

/**
 * Node of HAST.
 */
export interface HastNode extends HastParent {
  /** Type of Node. */
  type: string;
  /** Name of HTML tag. */
  tagName: string;
  /** Properties and attributes of HTML tag. */
  properties: { [key: string]: any };
}
