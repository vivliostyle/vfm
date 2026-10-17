/**
 * micromark extension for the VFM math syntax: inline `$...$` and display
 * `$$...$$`.
 *
 * Why not `micromark-extension-math` (remark-math): VFM documents rules in
 * `docs/vfm.md` that remark-math does not follow, and the test suite encodes
 * them. In remark-math `$3 and $4` is math, `$ x$` is math, `\$` does not
 * escape a dollar, `$$$x$$$` is math, and a `$$` block may contain blank
 * lines. This extension keeps the VFM rules:
 *
 * - inline: the content starts with a non-space, non-`$` character and ends
 *   right before a `$` that is not preceded by whitespace, `$` or an odd
 *   number of backslashes, and not followed by `$` or a digit
 * - display: `$$`, a non-`$` character (whitespace and line endings allowed),
 *   then `$$` that is not preceded or followed by `$`
 * - three or more `$` never open math
 * - the content is literal (no inline syntax inside) and may span lines
 *   within a paragraph, but not a blank line
 *
 * Only the rules changed form: the remark-parse 8 tokenizer matched them with
 * two regular expressions.
 */

import { asciiDigit, markdownLineEnding } from 'micromark-util-character';
import { codes } from 'micromark-util-symbol';
import type {
  Code,
  Construct,
  Extension,
  State,
  Tokenizer,
} from 'micromark-util-types';

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    mathInline: 'mathInline';
    mathInlineMarker: 'mathInlineMarker';
    mathInlineValue: 'mathInlineValue';
    mathDisplay: 'mathDisplay';
    mathDisplayMarker: 'mathDisplayMarker';
    mathDisplayValue: 'mathDisplayValue';
    /** Scratch token of the closer lookaheads; never reaches the event stream. */
    mathLookahead: 'mathLookahead';
  }
}

/**
 * Whether a character code is a space or a tab. micromark expands a tab into
 * `horizontalTab` followed by `virtualSpace` codes, so both count.
 * @param code - Character code.
 * @returns `true` for a space, a tab or a virtual space.
 */
const isSpaceOrTab = (code: Code): boolean =>
  code === codes.space ||
  code === codes.horizontalTab ||
  code === codes.virtualSpace;

/**
 * Lookahead from a candidate inline closer `$`: the next character must not
 * be `$` or a digit (`$x = y$7` is not math).
 */
const inlineCloserLookahead: Construct = {
  partial: true,
  tokenize: function (effects, ok, nok) {
    /**
     * At `$`: consume it inside a scratch token.
     * @param code - Character code (`$`).
     * @returns Next state.
     */
    const start: State = (code) => {
      effects.enter('mathLookahead');
      effects.consume(code);
      return after;
    };

    /**
     * After `$`: accept unless `$` or a digit follows.
     * @param code - Character code.
     * @returns Next state.
     */
    const after: State = (code) => {
      effects.exit('mathLookahead');
      return code === codes.dollarSign || asciiDigit(code)
        ? nok(code)
        : ok(code);
    };

    return start;
  },
};

/**
 * Lookahead from a candidate display closer: `$$` not followed by `$`.
 */
const displayCloserLookahead: Construct = {
  partial: true,
  tokenize: function (effects, ok, nok) {
    /**
     * At the first `$`: consume it inside a scratch token.
     * @param code - Character code (`$`).
     * @returns Next state.
     */
    const start: State = (code) => {
      effects.enter('mathLookahead');
      effects.consume(code);
      return second;
    };

    /**
     * The second character must be `$`.
     * @param code - Character code.
     * @returns Next state.
     */
    const second: State = (code) => {
      if (code !== codes.dollarSign) {
        effects.exit('mathLookahead');
        return nok(code);
      }
      effects.consume(code);
      return after;
    };

    /**
     * After `$$`: accept unless another `$` follows.
     * @param code - Character code.
     * @returns Next state.
     */
    const after: State = (code) => {
      effects.exit('mathLookahead');
      return code === codes.dollarSign ? nok(code) : ok(code);
    };

    return start;
  },
};

/**
 * Tokenize inline math `$...$`. The content is literal; line endings inside
 * are emitted as `lineEnding` tokens between `mathInlineValue` chunks.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeMathInline: Tokenizer = function (effects, ok, nok) {
  /** Previous content character, or `null` at the start of the content. */
  let previous: Code = null;
  /** Length of the backslash run right before the current character. */
  let backslashes = 0;
  /** Whether a `mathInlineValue` token is open. */
  let inValue = false;

  /**
   * Close the value token if one is open.
   */
  const closeValue = (): void => {
    if (inValue) {
      effects.exit('mathInlineValue');
      inValue = false;
    }
  };

  /**
   * Consume one content character and update the closer bookkeeping.
   * @param code - Character code.
   */
  const consumeContent = (code: Code): void => {
    if (!inValue) {
      effects.enter('mathInlineValue');
      inValue = true;
    }
    effects.consume(code);
    backslashes = code === codes.backslash ? backslashes + 1 : 0;
    previous = code;
  };

  /**
   * The candidate closer `$` is valid: close the math.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const close: State = (code) => {
    closeValue();
    effects.enter('mathInlineMarker');
    effects.consume(code);
    effects.exit('mathInlineMarker');
    effects.exit('mathInline');
    return ok;
  };

  /**
   * The candidate closer `$` is not valid: it is content.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const dollarAsContent: State = (code) => {
    consumeContent(code);
    return content;
  };

  /**
   * Inside the content.
   * @param code - Character code.
   * @returns Next state.
   */
  const content: State = (code) => {
    if (code === codes.eof) {
      return nok(code);
    }
    if (code === codes.dollarSign) {
      // A closer must not follow whitespace, `$` or an odd number of
      // backslashes (`\$` is an escaped dollar inside the math).
      const closable =
        previous !== null &&
        previous !== codes.dollarSign &&
        !isSpaceOrTab(previous) &&
        !markdownLineEnding(previous) &&
        backslashes % 2 === 0;
      if (!closable) {
        return dollarAsContent(code);
      }
      return effects.check(inlineCloserLookahead, close, dollarAsContent)(code);
    }
    if (markdownLineEnding(code)) {
      closeValue();
      effects.enter('lineEnding');
      effects.consume(code);
      effects.exit('lineEnding');
      backslashes = 0;
      previous = code;
      return content;
    }
    consumeContent(code);
    return content;
  };

  /**
   * After the opening `$`: the content must start with a character that is
   * not `$`, whitespace or a line ending.
   * @param code - Character code.
   * @returns Next state.
   */
  const afterOpen: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.dollarSign ||
      isSpaceOrTab(code) ||
      markdownLineEnding(code)
    ) {
      return nok(code);
    }
    consumeContent(code);
    return content;
  };

  /**
   * At the opening `$`.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const start: State = (code) => {
    effects.enter('mathInline');
    effects.enter('mathInlineMarker');
    effects.consume(code);
    effects.exit('mathInlineMarker');
    return afterOpen;
  };

  return start;
};

/**
 * Tokenize display math `$$...$$`. The content is literal and may begin with
 * whitespace or a line ending; line endings are emitted as `lineEnding`
 * tokens between `mathDisplayValue` chunks.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeMathDisplay: Tokenizer = function (effects, ok, nok) {
  /** Previous content character, or `null` at the start of the content. */
  let previous: Code = null;
  /** Whether a `mathDisplayValue` token is open. */
  let inValue = false;

  /**
   * Close the value token if one is open.
   */
  const closeValue = (): void => {
    if (inValue) {
      effects.exit('mathDisplayValue');
      inValue = false;
    }
  };

  /**
   * Consume one content character.
   * @param code - Character code.
   */
  const consumeContent = (code: Code): void => {
    if (!inValue) {
      effects.enter('mathDisplayValue');
      inValue = true;
    }
    effects.consume(code);
    previous = code;
  };

  /**
   * Second `$` of a valid closer: close the math.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const closeSecond: State = (code) => {
    effects.consume(code);
    effects.exit('mathDisplayMarker');
    effects.exit('mathDisplay');
    return ok;
  };

  /**
   * The candidate closer `$$` is valid: consume its first `$`.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const close: State = (code) => {
    closeValue();
    effects.enter('mathDisplayMarker');
    effects.consume(code);
    return closeSecond;
  };

  /**
   * The candidate closer is not valid: the `$` is content.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const dollarAsContent: State = (code) => {
    consumeContent(code);
    return content;
  };

  /**
   * Inside the content.
   * @param code - Character code.
   * @returns Next state.
   */
  const content: State = (code) => {
    if (code === codes.eof) {
      return nok(code);
    }
    if (code === codes.dollarSign) {
      // A closer must not follow `$`.
      if (previous === codes.dollarSign) {
        return dollarAsContent(code);
      }
      return effects.check(
        displayCloserLookahead,
        close,
        dollarAsContent,
      )(code);
    }
    if (markdownLineEnding(code)) {
      closeValue();
      effects.enter('lineEnding');
      effects.consume(code);
      effects.exit('lineEnding');
      previous = code;
      return content;
    }
    consumeContent(code);
    return content;
  };

  /**
   * After the opening `$$`: the content must start with a character that is
   * not `$`. Whitespace and line endings are allowed here.
   * @param code - Character code.
   * @returns Next state.
   */
  const afterOpen: State = (code) => {
    if (code === codes.eof || code === codes.dollarSign) {
      return nok(code);
    }
    return content(code);
  };

  /**
   * At the second `$` of the opener.
   * @param code - Character code.
   * @returns Next state.
   */
  const second: State = (code) => {
    if (code !== codes.dollarSign) {
      return nok(code);
    }
    effects.consume(code);
    effects.exit('mathDisplayMarker');
    return afterOpen;
  };

  /**
   * At the first `$` of the opener.
   * @param code - Character code (`$`).
   * @returns Next state.
   */
  const start: State = (code) => {
    effects.enter('mathDisplay');
    effects.enter('mathDisplayMarker');
    effects.consume(code);
    return second;
  };

  return start;
};

const mathDisplay: Construct = {
  name: 'mathDisplay',
  tokenize: tokenizeMathDisplay,
};
const mathInline: Construct = {
  name: 'mathInline',
  tokenize: tokenizeMathInline,
};

/**
 * Create the micromark extension for VFM math. Display math is tried first so
 * that `$$` is never read as an empty inline math.
 * @returns Extension to register on a remark processor
 *   (`micromarkExtensions`).
 */
export const mathSyntax = (): Extension => ({
  text: {
    [codes.dollarSign]: [mathDisplay, mathInline],
  },
});
