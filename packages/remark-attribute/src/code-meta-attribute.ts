import { factorySpace } from 'micromark-factory-space';
import { markdownLineEnding, markdownSpace } from 'micromark-util-character';
import { codes, types } from 'micromark-util-symbol';
import type * as micromark from 'micromark-util-types';

import { factoryAttributes } from './factory-attributes.js';

export const codeMetaTokenTypes = {
  attributes: 'codeMetaAttributes',
  attributesMarker: 'codeMetaAttributesMarker',
  attribute: 'codeMetaAttribute',
  attributeId: 'codeMetaAttributeId',
  attributeIdMarker: 'codeMetaAttributeIdMarker',
  attributeIdValue: 'codeMetaAttributeIdValue',
  attributeClass: 'codeMetaAttributeClass',
  attributeClassMarker: 'codeMetaAttributeClassMarker',
  attributeClassValue: 'codeMetaAttributeClassValue',
  attributeName: 'codeMetaAttributeName',
  attributeInitializerMarker: 'codeMetaAttributeInitializerMarker',
  attributeValueLiteral: 'codeMetaAttributeValueLiteral',
  attributeValue: 'codeMetaAttributeValue',
  attributeValueMarker: 'codeMetaAttributeValueMarker',
  attributeValueData: 'codeMetaAttributeValueData',
} as const;

const callFactoryAttributes = (
  effects: micromark.Effects,
  ok: micromark.State,
  nok: micromark.State,
) =>
  factoryAttributes(
    effects,
    ok,
    nok,
    codeMetaTokenTypes.attributes,
    codeMetaTokenTypes.attributesMarker,
    codeMetaTokenTypes.attribute,
    codeMetaTokenTypes.attributeId,
    codeMetaTokenTypes.attributeClass,
    codeMetaTokenTypes.attributeName,
    codeMetaTokenTypes.attributeInitializerMarker,
    codeMetaTokenTypes.attributeValueLiteral,
    codeMetaTokenTypes.attributeValue,
    codeMetaTokenTypes.attributeValueMarker,
    codeMetaTokenTypes.attributeValueData,
    true,
  );

const afterAttrs = (
  effects: micromark.Effects,
  ok: micromark.State,
  code: micromark.Code,
): micromark.State | undefined =>
  markdownSpace(code)
    ? factorySpace(
        effects,
        (code) => afterAttrs(effects, ok, code),
        types.whitespace,
      )(code)
    : code === codes.eof || markdownLineEnding(code)
      ? ok(code)
      : undefined;

/**
 * Partial construct for when `{` is the first meta character
 * (no open `codeFencedFenceMeta`).
 */
export const metaAttributeFromStart: micromark.Construct = {
  partial: true,
  tokenize: (effects, ok, nok) =>
    callFactoryAttributes(
      effects,
      (code) => afterAttrs(effects, ok, code) ?? nok(code),
      nok,
    ),
};

/**
 * Partial construct for when `{` appears mid-meta
 * (`codeFencedFenceMeta` + `chunkString` are open).
 * Exits those tokens before attempting attribute parsing;
 * `effects.attempt()` rolls them back on `nok`.
 */
export const metaAttributeFromMeta: micromark.Construct = {
  partial: true,
  tokenize: (effects, ok, nok) => (code) => {
    effects.exit(types.chunkString);
    effects.exit(types.codeFencedFenceMeta);
    return callFactoryAttributes(
      effects,
      (code) => afterAttrs(effects, ok, code) ?? nok(code),
      nok,
    )(code);
  },
};
