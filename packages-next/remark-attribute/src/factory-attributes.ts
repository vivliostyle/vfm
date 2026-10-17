// MIT (c) Titus Wormer <https://wooorm.com>
// Ported from `micromark-extension-directive`:
// https://github.com/micromark/micromark-extension-directive/blob/d19906200feba667b351ce60ee511f6204b662e0/dev/lib/factory-attributes.js

import { factorySpace } from 'micromark-factory-space';
import { factoryWhitespace } from 'micromark-factory-whitespace';
import {
  markdownLineEnding,
  markdownLineEndingOrSpace,
  markdownSpace,
  unicodePunctuation,
  unicodeWhitespace,
} from 'micromark-util-character';
import { codes, types } from 'micromark-util-symbol';
import type { Code, Effects, State, TokenType } from 'micromark-util-types';

/** Token types used by {@link factoryAttributes}, one set per context. */
export interface AttributeTokenTypes {
  attributes: TokenType;
  attributesMarker: TokenType;
  attribute: TokenType;
  attributeId: TokenType;
  attributeIdMarker: TokenType;
  attributeIdValue: TokenType;
  attributeClass: TokenType;
  attributeClassMarker: TokenType;
  attributeClassValue: TokenType;
  attributeName: TokenType;
  attributeInitializerMarker: TokenType;
  attributeValueLiteral: TokenType;
  attributeValue: TokenType;
  attributeValueMarker: TokenType;
  attributeValueData: TokenType;
}

/**
 * Tokenize an attribute list `{#id .class key=value}` starting at `{`.
 * @param effects - Tokenizer effects.
 * @param ok - Success state, called after `}`.
 * @param nok - Failure state.
 * @param t - Token types to emit.
 * @param disallowEol - Fail on a line ending inside the list (`true` for the
 *   inline and block forms, which must fit on one line).
 * @returns Initial state.
 */
export function factoryAttributes(
  effects: Effects,
  ok: State,
  nok: State,
  t: AttributeTokenTypes,
  disallowEol: boolean,
): State {
  /** Type of the shortcut being tokenized (`#id` or `.class`). */
  let shortcutType: 'id' | 'class' | undefined;
  /** Quote that opened the current value literal. */
  let marker: Code | undefined;

  /**
   * At `{`.
   * @param code - Character code (`{`).
   * @returns Next state.
   */
  const start: State = (code) => {
    effects.enter(t.attributes);
    effects.enter(t.attributesMarker);
    effects.consume(code);
    effects.exit(t.attributesMarker);
    return between;
  };

  /**
   * Between attributes: at a shortcut marker, whitespace, a name or `}`.
   * @param code - Character code.
   * @returns Next state.
   */
  const between: State = (code) => {
    if (code === codes.numberSign) {
      shortcutType = 'id';
      return shortcutStart(code);
    }
    if (code === codes.dot) {
      shortcutType = 'class';
      return shortcutStart(code);
    }
    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, between, types.whitespace)(code);
    }
    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, between)(code);
    }
    if (
      code === codes.eof ||
      markdownLineEnding(code) ||
      unicodeWhitespace(code) ||
      (unicodePunctuation(code) &&
        code !== codes.dash &&
        code !== codes.underscore)
    ) {
      return end(code);
    }
    effects.enter(t.attribute);
    effects.enter(t.attributeName);
    effects.consume(code);
    return name;
  };

  /**
   * At the marker of a shortcut (`#` or `.`).
   * @param code - Character code.
   * @returns Next state.
   */
  const shortcutStart: State = (code) => {
    effects.enter(t.attribute);
    effects.enter(shortcutType === 'id' ? t.attributeId : t.attributeClass);
    effects.enter(
      shortcutType === 'id' ? t.attributeIdMarker : t.attributeClassMarker,
    );
    effects.consume(code);
    effects.exit(
      shortcutType === 'id' ? t.attributeIdMarker : t.attributeClassMarker,
    );
    return shortcutStartAfter;
  };

  /**
   * After a shortcut marker: the value must start here.
   * @param code - Character code.
   * @returns Next state.
   */
  const shortcutStartAfter: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.numberSign ||
      code === codes.apostrophe ||
      code === codes.dot ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      code === codes.rightCurlyBrace ||
      markdownLineEndingOrSpace(code)
    ) {
      return nok(code);
    }
    effects.enter(
      shortcutType === 'id' ? t.attributeIdValue : t.attributeClassValue,
    );
    effects.consume(code);
    return shortcut;
  };

  /**
   * Inside a shortcut value.
   * @param code - Character code.
   * @returns Next state.
   */
  const shortcut: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code);
    }
    if (
      code === codes.numberSign ||
      code === codes.dot ||
      code === codes.rightCurlyBrace ||
      markdownLineEndingOrSpace(code)
    ) {
      effects.exit(
        shortcutType === 'id' ? t.attributeIdValue : t.attributeClassValue,
      );
      effects.exit(shortcutType === 'id' ? t.attributeId : t.attributeClass);
      effects.exit(t.attribute);
      return between(code);
    }
    effects.consume(code);
    return shortcut;
  };

  /**
   * Inside an attribute name.
   * @param code - Character code.
   * @returns Next state.
   */
  const name: State = (code) => {
    if (
      code === codes.eof ||
      markdownLineEnding(code) ||
      unicodeWhitespace(code) ||
      (unicodePunctuation(code) &&
        code !== codes.dash &&
        code !== codes.dot &&
        code !== codes.colon &&
        code !== codes.underscore)
    ) {
      effects.exit(t.attributeName);
      if (disallowEol && markdownSpace(code)) {
        return factorySpace(effects, nameAfter, types.whitespace)(code);
      }
      if (!disallowEol && markdownLineEndingOrSpace(code)) {
        return factoryWhitespace(effects, nameAfter)(code);
      }
      return nameAfter(code);
    }
    effects.consume(code);
    return name;
  };

  /**
   * After an attribute name: `=` starts a value, anything else ends the
   * attribute (boolean attribute).
   * @param code - Character code.
   * @returns Next state.
   */
  const nameAfter: State = (code) => {
    if (code === codes.equalsTo) {
      effects.enter(t.attributeInitializerMarker);
      effects.consume(code);
      effects.exit(t.attributeInitializerMarker);
      return valueBefore;
    }
    effects.exit(t.attribute);
    return between(code);
  };

  /**
   * After `=`: at a quote, whitespace or the start of an unquoted value.
   * @param code - Character code.
   * @returns Next state.
   */
  const valueBefore: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      code === codes.rightCurlyBrace ||
      (disallowEol && markdownLineEnding(code))
    ) {
      return nok(code);
    }
    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.enter(t.attributeValueLiteral);
      effects.enter(t.attributeValueMarker);
      effects.consume(code);
      effects.exit(t.attributeValueMarker);
      marker = code;
      return valueQuotedStart;
    }
    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, valueBefore, types.whitespace)(code);
    }
    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, valueBefore)(code);
    }
    effects.enter(t.attributeValue);
    effects.enter(t.attributeValueData);
    effects.consume(code);
    marker = undefined;
    return valueUnquoted;
  };

  /**
   * Inside an unquoted value.
   * @param code - Character code.
   * @returns Next state.
   */
  const valueUnquoted: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code);
    }
    if (code === codes.rightCurlyBrace || markdownLineEndingOrSpace(code)) {
      effects.exit(t.attributeValueData);
      effects.exit(t.attributeValue);
      effects.exit(t.attribute);
      return between(code);
    }
    effects.consume(code);
    return valueUnquoted;
  };

  /**
   * After the opening quote, or after a value chunk: at the closing quote or
   * more content.
   * @param code - Character code.
   * @returns Next state.
   */
  const valueQuotedStart: State = (code) => {
    if (code === marker) {
      effects.enter(t.attributeValueMarker);
      effects.consume(code);
      effects.exit(t.attributeValueMarker);
      effects.exit(t.attributeValueLiteral);
      effects.exit(t.attribute);
      return valueQuotedAfter;
    }
    effects.enter(t.attributeValue);
    return valueQuotedBetween(code);
  };

  /**
   * Inside a quoted value, between chunks.
   * @param code - Character code.
   * @returns Next state.
   */
  const valueQuotedBetween: State = (code) => {
    if (code === marker) {
      effects.exit(t.attributeValue);
      return valueQuotedStart(code);
    }
    if (code === codes.eof) {
      return nok(code);
    }
    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      return disallowEol
        ? nok(code)
        : factoryWhitespace(effects, valueQuotedBetween)(code);
    }
    effects.enter(t.attributeValueData);
    effects.consume(code);
    return valueQuoted;
  };

  /**
   * Inside a quoted value chunk.
   * @param code - Character code.
   * @returns Next state.
   */
  const valueQuoted: State = (code) => {
    if (code === marker || code === codes.eof || markdownLineEnding(code)) {
      effects.exit(t.attributeValueData);
      return valueQuotedBetween(code);
    }
    effects.consume(code);
    return valueQuoted;
  };

  /**
   * After a quoted value: whitespace or `}` continues, anything else ends.
   * @param code - Character code.
   * @returns Next state.
   */
  const valueQuotedAfter: State = (code) =>
    code === codes.rightCurlyBrace || markdownLineEndingOrSpace(code)
      ? between(code)
      : end(code);

  /**
   * At `}`, or at an invalid character.
   * @param code - Character code.
   * @returns Next state.
   */
  const end: State = (code) => {
    if (code === codes.rightCurlyBrace) {
      effects.enter(t.attributesMarker);
      effects.consume(code);
      effects.exit(t.attributesMarker);
      effects.exit(t.attributes);
      return ok;
    }
    return nok(code);
  };

  return start;
}
