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

    function start(code: number | null): State | undefined {
      // `{`. `consume` needs an open token even inside a `check`.
      effects.enter('rubyLookahead');
      effects.consume(code);
      return scan;
    }

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

    function escaped(code: number | null): State | undefined {
      if (code === codes.eof || markdownLineEnding(code)) {
        return done(nok, code);
      }
      effects.consume(code);
      return scan;
    }

    function done(next: State, code: number | null): State | undefined {
      effects.exit('rubyLookahead');
      return next(code);
    }
  },
};

const tokenizeRubyStart: Tokenizer = function (effects, ok, nok) {
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

  const giveUp: State = (code) => {
    start!._balanced = true;
    return nok(code);
  };

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

/** Wrap the events from the nearest open start up to `}` into a `ruby`. */
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

/** Turn starts that never closed back into plain data. */
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
 */
export const ruby = (): Extension => ({
  text: {
    [codes.leftCurlyBrace]: rubyStart,
    [codes.verticalBar]: rubyEnd,
  },
});
