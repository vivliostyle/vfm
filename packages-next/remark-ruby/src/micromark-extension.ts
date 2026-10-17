/**
 * micromark extension for the ruby syntax `{base|ruby}`.
 *
 * The construct follows the shape of CommonMark links in micromark:
 *
 * - `rubyStart` consumes `{` and records the token as an open start. It only
 *   succeeds when the rest of the line still holds an unescaped `|` followed
 *   by `}`, so a plain `{` costs one lookahead and never leaves a dangling
 *   token behind.
 * - The base text between `{` and `|` is tokenized by the regular text
 *   constructs, so it can contain emphasis, links, escapes and so on.
 * - `rubyEnd` consumes `|`, the literal ruby text and `}`, then `resolveTo`
 *   wraps everything from the nearest open start into one `ruby` token.
 * - Starts that never close are turned back into `data` by `resolveAll`.
 *
 * Rules carried over from the remark-parse 8 tokenizer: a ruby stays on one
 * line, base and ruby text are both non-empty, the ruby text is literal (no
 * inline syntax), and an escaped pipe (`\|`) is base text rather than the
 * separator.
 */

import { markdownLineEnding } from 'micromark-util-character';
import { push, splice } from 'micromark-util-chunked';
import { resolveAll } from 'micromark-util-resolve-all';
import { codes } from 'micromark-util-symbol';
import type {
  Construct,
  Event,
  Extension,
  Resolver,
  State,
  Token,
  Tokenizer,
} from 'micromark-util-types';

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    ruby: 'ruby';
    rubyStart: 'rubyStart';
    rubyStartMarker: 'rubyStartMarker';
    rubyBase: 'rubyBase';
    rubyEnd: 'rubyEnd';
    rubySeparatorMarker: 'rubySeparatorMarker';
    rubyText: 'rubyText';
    rubyEndMarker: 'rubyEndMarker';
    /** Scratch token of the lookahead; never reaches the event stream. */
    rubyLookahead: 'rubyLookahead';
  }

  interface TokenizeContext {
    /** Open `rubyStart` tokens, innermost last. */
    _rubyStarts?: Array<Token> | undefined;
  }
}

/**
 * Lookahead from `{`: is there an unescaped `|` and then a `}` before the
 * line ends? Necessary (not sufficient) for a ruby, which keeps plain `{`
 * from producing start tokens at all.
 */
const rubyLookahead: Construct = {
  partial: true,
  tokenize: function (effects, ok, nok) {
    let seenSeparator = false;
    return start;

    /**
     * At `{`: open the scratch token and consume the brace.
     * `consume` needs an open token even inside a `check`.
     * @param code - Current character code.
     * @returns Next state.
     */
    function start(code: number | null): State | undefined {
      effects.enter('rubyLookahead');
      effects.consume(code);
      return scan;
    }

    /**
     * Scan the rest of the line for an unescaped `|` followed by `}`.
     * Succeeds at the first `}` after a separator; fails at the line end.
     * @param code - Current character code.
     * @returns Next state.
     */
    function scan(code: number | null): State | undefined {
      if (code === codes.eof || markdownLineEnding(code)) {
        return done(nok, code);
      }
      if (code === codes.backslash) {
        effects.consume(code);
        return escaped;
      }
      if (code === codes.verticalBar) {
        seenSeparator = true;
      } else if (code === codes.rightCurlyBrace && seenSeparator) {
        return done(ok, code);
      }
      effects.consume(code);
      return scan;
    }

    /**
     * After a backslash: skip the escaped character so `\|` and `\}` do not count.
     * @param code - Current character code.
     * @returns Next state.
     */
    function escaped(code: number | null): State | undefined {
      if (code === codes.eof || markdownLineEnding(code)) {
        return done(nok, code);
      }
      effects.consume(code);
      return scan;
    }

    /**
     * Close the scratch token and hand over to `ok` or `nok`.
     * @param next - `ok` or `nok`.
     * @param code - Current character code.
     * @returns Next state.
     */
    function done(next: State, code: number | null): State | undefined {
      effects.exit('rubyLookahead');
      return next(code);
    }
  },
};

/**
 * Tokenize `{` as a ruby start, after the lookahead confirms that a closing
 * `|...}` follows on the same line. The start token is pushed onto
 * `_rubyStarts` for the matching `rubyEnd`.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeRubyStart: Tokenizer = function (effects, ok, nok) {
  /**
   * Consume `{` as `rubyStartMarker` and record the start token.
   * @param code - Current character code (`{`).
   * @returns Next state.
   */
  const open: State = (code) => {
    effects.enter('rubyStart');
    effects.enter('rubyStartMarker');
    effects.consume(code);
    effects.exit('rubyStartMarker');
    const token = effects.exit('rubyStart');
    (this._rubyStarts ??= []).push(token);
    return ok;
  };

  return (code) => effects.check(rubyLookahead, open, nok)(code);
};

/**
 * Tokenize `|`, the literal ruby text and `}` as a ruby end. Requires an open
 * start on the same line with a non-empty base; otherwise the `|` stays text.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeRubyEnd: Tokenizer = function (effects, ok, nok) {
  const starts = this._rubyStarts;
  let start: Token | undefined;

  if (starts) {
    // Starts that were already closed or given up are not needed anymore.
    while (starts.length > 0 && starts[starts.length - 1]!._balanced) {
      starts.pop();
    }
    start = starts[starts.length - 1];
  }

  /**
   * Fail and mark the start as balanced: nothing later on this line can
   * close it anymore, so `resolveAll` turns it back into data.
   * @param code - Current character code.
   * @returns Next state.
   */
  const giveUp: State = (code) => {
    start!._balanced = true;
    return nok(code);
  };

  /**
   * Inside the ruby text: consume literally up to the first `}`, which closes
   * the ruby. A line end before that gives up.
   * @param code - Current character code.
   * @returns Next state.
   */
  const text: State = (code) => {
    if (code === codes.eof || markdownLineEnding(code)) {
      return giveUp(code);
    }
    if (code === codes.rightCurlyBrace) {
      effects.exit('rubyText');
      effects.enter('rubyEndMarker');
      effects.consume(code);
      effects.exit('rubyEndMarker');
      effects.exit('rubyEnd');
      starts!.pop();
      return ok;
    }
    effects.consume(code);
    return text;
  };

  /**
   * After `|`: the ruby text must be non-empty, so `}` or a line end here
   * gives up.
   * @param code - Current character code.
   * @returns Next state.
   */
  const textStart: State = (code) => {
    if (
      code === codes.eof ||
      code === codes.rightCurlyBrace ||
      markdownLineEnding(code)
    ) {
      // Empty ruby text.
      return giveUp(code);
    }
    effects.enter('rubyText');
    return text(code);
  };

  /**
   * At `|`: check for an open start on the same line with a non-empty base,
   * then consume the separator.
   * @param code - Current character code (`|`).
   * @returns Next state.
   */
  const begin: State = (code) => {
    if (!start) {
      return nok(code);
    }
    const now = this.now();
    if (start.end.line !== now.line) {
      // A ruby does not span lines; this start can never close.
      return giveUp(code);
    }
    if (start.end.offset === now.offset) {
      // Empty base. Keep the start open: a later `|` may still close it.
      return nok(code);
    }
    effects.enter('rubyEnd');
    effects.enter('rubySeparatorMarker');
    effects.consume(code);
    effects.exit('rubySeparatorMarker');
    return textStart;
  };

  return begin;
};

/**
 * Wrap the events from the nearest open start up to `}` into a `ruby` token
 * with a `rubyBase` around the base content. Runs right after `rubyEnd`
 * succeeds.
 * @param events - Events of the current text content.
 * @param context - Tokenize context.
 * @returns The same array, modified in place.
 */
const resolveToRuby: Resolver = function (events, context) {
  let index = events.length;
  let open: number | undefined;
  let close: number | undefined;

  while (index--) {
    const [kind, token] = events[index]!;
    if (close === undefined) {
      if (kind === 'enter' && token.type === 'rubyEnd') {
        close = index;
      }
    } else if (
      kind === 'enter' &&
      token.type === 'rubyStart' &&
      !token._balanced
    ) {
      open = index;
      break;
    }
  }
  if (open === undefined || close === undefined) {
    return events;
  }

  // `open`: enter rubyStart, +1 enter marker, +2 exit marker, +3 exit rubyStart.
  const startToken = events[open]![1];
  startToken._balanced = true;

  const ruby: Token = {
    type: 'ruby',
    start: { ...startToken.start },
    end: { ...events[events.length - 1]![1].end },
  };
  const base: Token = {
    type: 'rubyBase',
    start: { ...startToken.end },
    end: { ...events[close]![1].start },
  };

  let next: Array<Event> = [['enter', ruby, context]];
  // `{`
  next = push(next, events.slice(open + 1, open + 3));
  // Base text, re-resolved so attention inside it is handled.
  next = push(next, [['enter', base, context]]);
  const insideSpan = context.parser.constructs.insideSpan.null;
  const between = events.slice(open + 4, close);
  next = push(
    next,
    insideSpan ? resolveAll(insideSpan, between, context) : between,
  );
  next = push(next, [['exit', base, context]]);
  // `|`, ruby text, `}` (the `rubyEnd` wrapper itself is dropped).
  next = push(next, events.slice(close + 1, events.length - 1));
  next = push(next, [['exit', ruby, context]]);

  splice(events, open, events.length - open, next);
  return events;
};

/**
 * Turn starts that never closed back into plain data. Runs once over the whole
 * text content after tokenizing.
 * @param events - Events of the current text content.
 * @returns The same array, modified in place.
 */
const resolveAllRuby: Resolver = function (events) {
  let index = -1;
  while (++index < events.length) {
    const token = events[index]![1];
    if (token.type === 'rubyStart') {
      token.type = 'data';
      // Skip the marker enter/exit; the exit of the start shares the token.
      index += 2;
    }
  }
  return events;
};

const rubyStart: Construct = {
  name: 'rubyStart',
  tokenize: tokenizeRubyStart,
  resolveAll: resolveAllRuby,
};

const rubyEnd: Construct = {
  name: 'rubyEnd',
  tokenize: tokenizeRubyEnd,
  resolveTo: resolveToRuby,
};

/**
 * Create a micromark extension for `{base|ruby}`.
 * @returns Extension to pass to micromark (`extensions`) or to register on a
 *   remark processor (`micromarkExtensions`).
 */
export const ruby = (): Extension => ({
  text: {
    [codes.leftCurlyBrace]: rubyStart,
    [codes.verticalBar]: rubyEnd,
  },
});
