import { factorySpace } from 'micromark-factory-space';
import { markdownLineEnding } from 'micromark-util-character';
import { codes, types as tokenTypes } from 'micromark-util-symbol';
import type * as micromark from 'micromark-util-types';

import { codeFenced } from './code-fenced.js';
import { codeMetaTokenTypes } from './code-meta-attribute.ts';
import { factoryAttributes } from './factory-attributes.js';

const inlineTokenTypes = {
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
} as const;

const attributeText: micromark.Construct = {
  tokenize: (effects, ok, nok) => (code) =>
    (code !== codes.leftCurlyBrace
      ? nok
      : factoryAttributes(
          effects,
          ok,
          nok,
          inlineTokenTypes.attributes,
          inlineTokenTypes.attributesMarker,
          inlineTokenTypes.attribute,
          inlineTokenTypes.attributeId,
          inlineTokenTypes.attributeClass,
          inlineTokenTypes.attributeName,
          inlineTokenTypes.attributeInitializerMarker,
          inlineTokenTypes.attributeValueLiteral,
          inlineTokenTypes.attributeValue,
          inlineTokenTypes.attributeValueMarker,
          inlineTokenTypes.attributeValueData,
          true,
        ))(code),
};

const blockTokenTypes = {
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
} as const;

const attributeFlow: micromark.Construct = {
  tokenize: (effects, ok, nok) => (code) =>
    (code !== codes.leftCurlyBrace
      ? nok
      : factoryAttributes(
          effects,
          factorySpace(
            effects,
            (code) =>
              (code !== codes.eof && !markdownLineEnding(code) ? nok : ok)(
                code,
              ),
            tokenTypes.whitespace,
          ),
          nok,
          blockTokenTypes.attributes,
          blockTokenTypes.attributesMarker,
          blockTokenTypes.attribute,
          blockTokenTypes.attributeId,
          blockTokenTypes.attributeClass,
          blockTokenTypes.attributeName,
          blockTokenTypes.attributeInitializerMarker,
          blockTokenTypes.attributeValueLiteral,
          blockTokenTypes.attributeValue,
          blockTokenTypes.attributeValueMarker,
          blockTokenTypes.attributeValueData,
          true,
        ))(code),
};

type TokenSelfMap<T extends Record<string, string>> = {
  [K in T[keyof T]]: K;
};

declare module 'micromark-util-types' {
  interface TokenTypeMap
    extends TokenSelfMap<typeof inlineTokenTypes>,
      TokenSelfMap<typeof blockTokenTypes>,
      TokenSelfMap<typeof codeMetaTokenTypes> {}
}

export const attribute = (): micromark.Extension => ({
  text: { [codes.leftCurlyBrace]: attributeText },
  flow: {
    [codes.leftCurlyBrace]: attributeFlow,
    [codes.graveAccent]: codeFenced,
    [codes.tilde]: codeFenced,
  },
  disable: { null: ['codeFenced'] },
});
