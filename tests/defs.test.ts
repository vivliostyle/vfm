import { VFM } from '../src';

it('has valid inlineMethods', () => {
  const vfm = VFM({ partial: true }).freeze();
  expect(vfm.Parser.prototype.inlineMethods).toEqual([
    'escape',
    'autoLink',
    'url',
    'email',
    'html',
    'link',
    'inlineNote',
    'footnoteCall',
    'reference',
    'strong',
    'emphasis',
    'deletion',
    'code',
    'break',
    'ruby',
    'math',
    'text',
  ]);
});

it('has valid blockMethods', () => {
  const vfm = VFM({ partial: true }).freeze();
  expect(vfm.Parser.prototype.blockMethods).toEqual([
    'yamlFrontMatter',
    'blankLine',
    'indentedCode',
    'fencedCode',
    'math',
    'blockquote',
    'atxHeading',
    'thematicBreak',
    'list',
    'setextHeading',
    'shortcode',
    'html',
    'footnoteDefinition',
    'definition',
    'table',
    'fencedBlock',
    'paragraph',
  ]);
});

it('has valid interruptParagraph', () => {
  const vfm = VFM({ partial: true }).freeze();
  const interrupters = vfm.Parser.prototype.interruptParagraph.map(
    ([name]: string[]) => name,
  );
  expect(interrupters).toEqual([
    'math',
    'thematicBreak',
    'list',
    'atxHeading',
    'fencedCode',
    'blockquote',
    'html',
    'setextHeading',
    'definition',
  ]);
});

it('has valid interruptList', () => {
  const vfm = VFM({ partial: true }).freeze();
  const interrupters = vfm.Parser.prototype.interruptList.map(
    ([name]: string[]) => name,
  );
  expect(interrupters).toEqual([
    'math',
    'atxHeading',
    'fencedCode',
    'thematicBreak',
    'definition',
  ]);
});

it('has valid interruptBlockquote', () => {
  const vfm = VFM({ partial: true }).freeze();
  const interrupters = vfm.Parser.prototype.interruptBlockquote.map(
    ([name]: string[]) => name,
  );
  expect(interrupters).toEqual([
    'math',
    'indentedCode',
    'fencedCode',
    'atxHeading',
    'setextHeading',
    'thematicBreak',
    'html',
    'list',
    'definition',
  ]);
});

it('has valid interruptFootnoteDefinition', () => {
  const vfm = VFM({ partial: true }).freeze();
  const interrupters = vfm.Parser.prototype.interruptFootnoteDefinition.map(
    ([name]: string[]) => name,
  );
  expect(interrupters).toEqual([
    'blankLine',
    'fencedCode',
    'blockquote',
    'atxHeading',
    'thematicBreak',
    'list',
    'setextHeading',
    'html',
    'definition',
    'table',
    'fencedBlock',
    'footnoteDefinition',
  ]);
});
