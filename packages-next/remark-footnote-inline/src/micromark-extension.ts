/**
 * micromark extension for inline footnotes `^[...]` (Pandoc style).
 *
 * Modelled on CommonMark links in micromark, like the ruby extension:
 *
 * - `footnoteInlineStart` consumes `^[` and records the token as an open
 *   start. A `^` that is not followed by `[` is left alone.
 * - The note text is tokenized by the regular text constructs, so it can hold
 *   emphasis, links, code and so on.
 * - `footnoteInlineEnd` consumes `]` and, through `resolveTo`, wraps everything
 *   from the nearest open start into one `footnoteInline` token. It yields to
 *   a link or image label that was opened later (`^[see [a](b)]`), so brackets
 *   pair from the inside out.
 * - Starts that never close are turned back into `data` by `resolveAll`.
 *
 * GFM footnote references `[^id]` start with `[`, so they do not meet this
 * construct.
 */

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
    footnoteInline: 'footnoteInline';
    footnoteInlineStart: 'footnoteInlineStart';
    footnoteInlineStartMarker: 'footnoteInlineStartMarker';
    footnoteInlineText: 'footnoteInlineText';
    footnoteInlineEnd: 'footnoteInlineEnd';
    footnoteInlineEndMarker: 'footnoteInlineEndMarker';
  }

  interface TokenizeContext {
    /** Open `footnoteInlineStart` tokens, innermost last. */
    _footnoteInlineStarts?: Array<Token> | undefined;
  }
}

/**
 * Tokenize `^[` as the start of an inline footnote and record the token for
 * the matching `footnoteInlineEnd`.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeFootnoteInlineStart: Tokenizer = function (effects, ok, nok) {
  /**
   * At `[` after `^`: close the marker and record the start.
   * @param code - Character code.
   * @returns Next state.
   */
  const open: State = (code) => {
    if (code !== codes.leftSquareBracket) {
      return nok(code);
    }
    effects.consume(code);
    effects.exit('footnoteInlineStartMarker');
    const token = effects.exit('footnoteInlineStart');
    (this._footnoteInlineStarts ??= []).push(token);
    return ok;
  };

  /**
   * At `^`.
   * @param code - Character code (`^`).
   * @returns Next state.
   */
  const start: State = (code) => {
    effects.enter('footnoteInlineStart');
    effects.enter('footnoteInlineStartMarker');
    effects.consume(code);
    return open;
  };

  return start;
};

/**
 * Whether a link or image label was opened after `start` and is still open,
 * in which case the `]` belongs to that label.
 * @param labelStarts - Core label start tokens of the text content.
 * @param start - Open inline footnote start.
 * @returns `true` when a newer label is open.
 */
const hasNewerOpenLabel = (
  labelStarts: Array<Token> | undefined,
  start: Token,
): boolean =>
  (labelStarts ?? []).some(
    (label) => !label._balanced && label.start.offset > start.start.offset,
  );

/**
 * Tokenize `]` as the end of an inline footnote. Requires an open start with
 * non-empty content and no newer open link / image label.
 * @param effects - Tokenizer effects.
 * @param ok - Success state.
 * @param nok - Failure state.
 * @returns Initial state.
 */
const tokenizeFootnoteInlineEnd: Tokenizer = function (effects, ok, nok) {
  const starts = this._footnoteInlineStarts;
  let start: Token | undefined;

  if (starts) {
    // Starts that were already closed or given up are not needed anymore.
    while (starts.length > 0 && starts[starts.length - 1]!._balanced) {
      starts.pop();
    }
    start = starts[starts.length - 1];
  }

  /**
   * At `]`.
   * @param code - Character code (`]`).
   * @returns Next state.
   */
  const begin: State = (code) => {
    if (!start || hasNewerOpenLabel(this._labelStarts, start)) {
      return nok(code);
    }
    if (start.end.offset === this.now().offset) {
      // Empty note: `^[]` stays text and the start can never close.
      start._balanced = true;
      return nok(code);
    }
    effects.enter('footnoteInlineEnd');
    effects.enter('footnoteInlineEndMarker');
    effects.consume(code);
    effects.exit('footnoteInlineEndMarker');
    effects.exit('footnoteInlineEnd');
    starts!.pop();
    return ok;
  };

  return begin;
};

/** Wrap the events from the nearest open start up to `]` into a note. */
const resolveToFootnoteInline: Resolver = function (events, context) {
  let index = events.length;
  let open: number | undefined;
  let close: number | undefined;

  while (index--) {
    const [kind, token] = events[index]!;
    if (close === undefined) {
      if (kind === 'enter' && token.type === 'footnoteInlineEnd') {
        close = index;
      }
    } else if (
      kind === 'enter' &&
      token.type === 'footnoteInlineStart' &&
      !token._balanced
    ) {
      open = index;
      break;
    }
  }
  if (open === undefined || close === undefined) {
    return events;
  }

  // `open`: enter start, +1 enter marker, +2 exit marker, +3 exit start.
  const startToken = events[open]![1];
  startToken._balanced = true;

  const note: Token = {
    type: 'footnoteInline',
    start: { ...startToken.start },
    end: { ...events[events.length - 1]![1].end },
  };
  const text: Token = {
    type: 'footnoteInlineText',
    start: { ...startToken.end },
    end: { ...events[close]![1].start },
  };

  let next: Array<Event> = [['enter', note, context]];
  // `^[`
  next = push(next, events.slice(open + 1, open + 3));
  // Note text, re-resolved so attention inside it is handled.
  next = push(next, [['enter', text, context]]);
  const insideSpan = context.parser.constructs.insideSpan.null;
  const between = events.slice(open + 4, close);
  next = push(
    next,
    insideSpan ? resolveAll(insideSpan, between, context) : between,
  );
  next = push(next, [['exit', text, context]]);
  // `]` (the `footnoteInlineEnd` wrapper itself is dropped).
  next = push(next, events.slice(close + 1, events.length - 1));
  next = push(next, [['exit', note, context]]);

  splice(events, open, events.length - open, next);
  return events;
};

/**
 * Turn starts that never closed back into plain data.
 * @param events - Events of the current text content.
 * @returns The same array, modified in place.
 */
const resolveAllFootnoteInline: Resolver = function (events) {
  let index = -1;
  while (++index < events.length) {
    const token = events[index]![1];
    if (token.type === 'footnoteInlineStart') {
      token.type = 'data';
      // Skip the marker enter/exit; the exit of the start shares the token.
      index += 2;
    }
  }
  return events;
};

const footnoteInlineStart: Construct = {
  name: 'footnoteInlineStart',
  tokenize: tokenizeFootnoteInlineStart,
  resolveAll: resolveAllFootnoteInline,
};

const footnoteInlineEnd: Construct = {
  name: 'footnoteInlineEnd',
  tokenize: tokenizeFootnoteInlineEnd,
  resolveTo: resolveToFootnoteInline,
};

/**
 * Create the micromark extension for `^[...]`.
 * @returns Extension to register on a remark processor
 *   (`micromarkExtensions`).
 */
export const footnoteInlineSyntax = (): Extension => ({
  text: {
    [codes.caret]: footnoteInlineStart,
    [codes.rightSquareBracket]: footnoteInlineEnd,
  },
});
