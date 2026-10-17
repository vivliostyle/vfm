/**
 * micromark extension for the VFM shortcode syntax: a line that holds only
 * `[[name]]` or `[[name key="value" ...]]`.
 *
 * Replaces `remark-shortcodes`, which patched the remark-parse 8 block
 * tokenizers (`startBlock: '[['`, `endBlock: ']]'`) and is a no-op under
 * remark-parse 11. The rules are kept:
 *
 * - a flow (block) construct; it does not interrupt a paragraph, so
 *   `text\n[[toc]]` stays one paragraph
 * - `[[`, optional whitespace, an identifier made of non-whitespace
 *   characters, then either `]]` or whitespace followed by a literal
 *   attribute string and `]]`
 * - everything stays on one line; `[[]]` and `[[ ]]` are not shortcodes
 *
 * Differences from remark-shortcodes: the closing `]]` must be the last thing
 * on the line except whitespace (`[[toc]] text` is a paragraph), and only such
 * a `]]` closes the shortcode, so `]]` inside an attribute value is content.
 */

import { factorySpace } from 'micromark-factory-space';
import { markdownLineEnding, markdownSpace } from 'micromark-util-character';
import { codes, types } from 'micromark-util-symbol';
import type {
  Construct,
  Extension,
  State,
  Tokenizer,
} from 'micromark-util-types';

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    shortcode: 'shortcode';
    shortcodeMarker: 'shortcodeMarker';
    shortcodeIdentifier: 'shortcodeIdentifier';
    shortcodeAttributes: 'shortcodeAttributes';
    /** Scratch token of the closer lookahead; never reaches the event stream. */
    shortcodeLookahead: 'shortcodeLookahead';
  }
}

/**
 * Lookahead from a candidate closer `]`: `]]`, optional whitespace, then a
 * line ending or the end of the file.
 */
const closerLookahead: Construct = {
  partial: true,
  tokenize: function (effects, ok, nok) {
    /**
     * At the first `]`: consume it inside a scratch token.
     * @param code - Character code (`]`).
     * @returns Next state.
     */
    const start: State = (code) => {
      effects.enter('shortcodeLookahead');
      effects.consume(code);
      return second;
    };

    /**
     * The second character must be `]`.
     * @param code - Character code.
     * @returns Next state.
     */
    const second: State = (code) => {
      if (code !== codes.rightSquareBracket) {
        effects.exit('shortcodeLookahead');
        return nok(code);
      }
      effects.consume(code);
      return after;
    };

    /**
     * After `]]`: skip whitespace, then accept only at the end of the line.
     * @param code - Character code.
     * @returns Next state.
     */
    const after: State = (code) => {
      if (markdownSpace(code)) {
        effects.consume(code);
        return after;
      }
      effects.exit('shortcodeLookahead');
      return code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : nok(code);
    };

    return start;
  },
};

/**
 * Tokenize a shortcode line `[[identifier attributes]]`.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeShortcode: Tokenizer = function (effects, ok, nok) {
  /**
   * After the trailing whitespace: close the shortcode. The closer lookahead
   * already guaranteed that a line ending or the end of the file follows.
   * @param code - Character code.
   * @returns Next state.
   */
  const end: State = (code) => {
    effects.exit('shortcode');
    return ok(code);
  };

  /**
   * At the second `]` of the closer.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const closeSecond: State = (code) => {
    effects.consume(code);
    effects.exit('shortcodeMarker');
    return factorySpace(effects, end, types.whitespace);
  };

  /**
   * At the first `]` of a valid closer.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const close: State = (code) => {
    effects.enter('shortcodeMarker');
    effects.consume(code);
    return closeSecond;
  };

  /**
   * A valid closer follows the attribute string: close it first.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const closeAfterAttributes: State = (code) => {
    effects.exit('shortcodeAttributes');
    return close(code);
  };

  /**
   * Inside the attribute string.
   * @param code - Character code.
   * @returns Next state.
   */
  const attributes: State = (code) => {
    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) {
      return effects.check(
        closerLookahead,
        closeAfterAttributes,
        attributeContent,
      )(code);
    }
    effects.consume(code);
    return attributes;
  };

  /**
   * A `]` that does not close the shortcode is attribute content.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const attributeContent: State = (code) => {
    effects.consume(code);
    return attributes;
  };

  /**
   * At the first character of the attribute string.
   * @param code - Character code.
   * @returns Next state.
   */
  const attributesStart: State = (code) => {
    effects.enter('shortcodeAttributes');
    return attributes(code);
  };

  /**
   * After the identifier and whitespace: a closer (`[[toc ]]`) or the
   * attribute string.
   * @param code - Character code.
   * @returns Next state.
   */
  const afterIdentifier: State = (code) => {
    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) {
      return effects.check(closerLookahead, close, attributesStart)(code);
    }
    return attributesStart(code);
  };

  /**
   * A valid closer follows the identifier: close it first.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const closeAfterIdentifier: State = (code) => {
    effects.exit('shortcodeIdentifier');
    return close(code);
  };

  /**
   * Inside the identifier.
   * @param code - Character code.
   * @returns Next state.
   */
  const identifier: State = (code) => {
    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code);
    }
    if (markdownSpace(code)) {
      effects.exit('shortcodeIdentifier');
      return factorySpace(effects, afterIdentifier, types.whitespace)(code);
    }
    if (code === codes.rightSquareBracket) {
      return effects.check(
        closerLookahead,
        closeAfterIdentifier,
        identifierContent,
      )(code);
    }
    effects.consume(code);
    return identifier;
  };

  /**
   * A `]` that does not close the shortcode is identifier content.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const identifierContent: State = (code) => {
    effects.consume(code);
    return identifier;
  };

  /**
   * At the first character of the identifier. It must not be `]` (empty
   * identifier), a line ending or the end of the file.
   * @param code - Character code.
   * @returns Next state.
   */
  const identifierStart: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.rightSquareBracket ||
      markdownLineEnding(code)
    ) {
      return nok(code);
    }
    effects.enter('shortcodeIdentifier');
    return identifier(code);
  };

  /**
   * At the second `[` of the opener.
   * @param code - Character code.
   * @returns Next state.
   */
  const openSecond: State = (code) => {
    if (code !== codes.leftSquareBracket) {
      return nok(code);
    }
    effects.consume(code);
    effects.exit('shortcodeMarker');
    return factorySpace(effects, identifierStart, types.whitespace);
  };

  /**
   * At the first `[`. A shortcode does not interrupt a paragraph; it only
   * follows a finished block.
   * @param code - Character code (`[`).
   * @returns Next state.
   */
  const start: State = (code) => {
    if (this.interrupt) {
      return nok(code);
    }
    effects.enter('shortcode');
    effects.enter('shortcodeMarker');
    effects.consume(code);
    return openSecond;
  };

  return start;
};

const shortcode: Construct = {
  name: 'shortcode',
  tokenize: tokenizeShortcode,
};

/**
 * Create the micromark extension for VFM shortcodes.
 * @returns Extension to register on a remark processor
 *   (`micromarkExtensions`).
 */
export const shortcodeSyntax = (): Extension => ({
  flow: { [codes.leftSquareBracket]: shortcode },
});
