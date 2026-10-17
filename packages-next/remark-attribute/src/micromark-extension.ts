/**
 * micromark extension for the attribute syntax `{#id .class key=value}`.
 *
 * Two constructs are registered:
 *
 * - `text` at `{`: an inline attribute list (`inlineAttributes`). Where it
 *   attaches (the preceding inline node, or the heading it ends) is decided
 *   by the `mdast-util-from-markdown` extension.
 * - `flow` at `{`: an attribute list alone on its line (`blockAttributes`),
 *   which attaches to the preceding block.
 *
 * Both forms must fit on one line. An attribute list that does not parse is
 * left to the other constructs, so plain `{` text is unaffected.
 */

import { factorySpace } from 'micromark-factory-space';
import { markdownLineEnding } from 'micromark-util-character';
import { codes, types as tokenTypes } from 'micromark-util-symbol';
import type { Construct, Extension, State } from 'micromark-util-types';
import {
  factoryAttributes,
  type AttributeTokenTypes,
} from './factory-attributes.js';

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    inlineAttributes: 'inlineAttributes';
    inlineAttributesMarker: 'inlineAttributesMarker';
    inlineAttribute: 'inlineAttribute';
    inlineAttributeId: 'inlineAttributeId';
    inlineAttributeIdMarker: 'inlineAttributeIdMarker';
    inlineAttributeIdValue: 'inlineAttributeIdValue';
    inlineAttributeClass: 'inlineAttributeClass';
    inlineAttributeClassMarker: 'inlineAttributeClassMarker';
    inlineAttributeClassValue: 'inlineAttributeClassValue';
    inlineAttributeName: 'inlineAttributeName';
    inlineAttributeInitializerMarker: 'inlineAttributeInitializerMarker';
    inlineAttributeValueLiteral: 'inlineAttributeValueLiteral';
    inlineAttributeValue: 'inlineAttributeValue';
    inlineAttributeValueMarker: 'inlineAttributeValueMarker';
    inlineAttributeValueData: 'inlineAttributeValueData';
    blockAttributes: 'blockAttributes';
    blockAttributesMarker: 'blockAttributesMarker';
    blockAttribute: 'blockAttribute';
    blockAttributeId: 'blockAttributeId';
    blockAttributeIdMarker: 'blockAttributeIdMarker';
    blockAttributeIdValue: 'blockAttributeIdValue';
    blockAttributeClass: 'blockAttributeClass';
    blockAttributeClassMarker: 'blockAttributeClassMarker';
    blockAttributeClassValue: 'blockAttributeClassValue';
    blockAttributeName: 'blockAttributeName';
    blockAttributeInitializerMarker: 'blockAttributeInitializerMarker';
    blockAttributeValueLiteral: 'blockAttributeValueLiteral';
    blockAttributeValue: 'blockAttributeValue';
    blockAttributeValueMarker: 'blockAttributeValueMarker';
    blockAttributeValueData: 'blockAttributeValueData';
  }
}

/** Token types of the inline form. */
export const inlineTokenTypes: AttributeTokenTypes = {
  attributes: 'inlineAttributes',
  attributesMarker: 'inlineAttributesMarker',
  attribute: 'inlineAttribute',
  attributeId: 'inlineAttributeId',
  attributeIdMarker: 'inlineAttributeIdMarker',
  attributeIdValue: 'inlineAttributeIdValue',
  attributeClass: 'inlineAttributeClass',
  attributeClassMarker: 'inlineAttributeClassMarker',
  attributeClassValue: 'inlineAttributeClassValue',
  attributeName: 'inlineAttributeName',
  attributeInitializerMarker: 'inlineAttributeInitializerMarker',
  attributeValueLiteral: 'inlineAttributeValueLiteral',
  attributeValue: 'inlineAttributeValue',
  attributeValueMarker: 'inlineAttributeValueMarker',
  attributeValueData: 'inlineAttributeValueData',
};

/** Token types of the block form. */
export const blockTokenTypes: AttributeTokenTypes = {
  attributes: 'blockAttributes',
  attributesMarker: 'blockAttributesMarker',
  attribute: 'blockAttribute',
  attributeId: 'blockAttributeId',
  attributeIdMarker: 'blockAttributeIdMarker',
  attributeIdValue: 'blockAttributeIdValue',
  attributeClass: 'blockAttributeClass',
  attributeClassMarker: 'blockAttributeClassMarker',
  attributeClassValue: 'blockAttributeClassValue',
  attributeName: 'blockAttributeName',
  attributeInitializerMarker: 'blockAttributeInitializerMarker',
  attributeValueLiteral: 'blockAttributeValueLiteral',
  attributeValue: 'blockAttributeValue',
  attributeValueMarker: 'blockAttributeValueMarker',
  attributeValueData: 'blockAttributeValueData',
};

const attributeText: Construct = {
  name: 'attributeText',
  tokenize: function (effects, ok, nok) {
    return factoryAttributes(effects, ok, nok, inlineTokenTypes, true);
  },
};

const attributeFlow: Construct = {
  name: 'attributeFlow',
  tokenize: function (effects, ok, nok) {
    /**
     * After `}`: only whitespace may follow on the line.
     * @param code - Character code.
     * @returns Next state.
     */
    const afterList: State = (code) =>
      code !== codes.eof && !markdownLineEnding(code) ? nok(code) : ok(code);

    const list = factoryAttributes(
      effects,
      factorySpace(effects, afterList, tokenTypes.whitespace),
      nok,
      blockTokenTypes,
      true,
    );

    /**
     * At `{`. A block attribute list does not interrupt a paragraph, so
     * `text\n{.class}` stays one paragraph; it only follows a finished block.
     * @param code - Character code (`{`).
     * @returns Next state.
     */
    const start: State = (code) => (this.interrupt ? nok(code) : list(code));

    return start;
  },
};

/**
 * Create the micromark extension for attribute lists.
 * @returns Extension to register on a remark processor
 *   (`micromarkExtensions`).
 */
export const attributeSyntax = (): Extension => ({
  text: { [codes.leftCurlyBrace]: attributeText },
  flow: { [codes.leftCurlyBrace]: attributeFlow },
});
