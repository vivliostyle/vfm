// Digital Publishing WAI-ARIA Module 1.0
// https://idpf.github.io/epub-guides/epub-aria-authoring/

export type RoleMappingTable = Record<string, string[]>;

export const roleMappingTable: RoleMappingTable = {
  'doc-abstract': ['section'],
  'doc-acknowledgements': ['section'],
  'doc-afterword': ['section'],
  'doc-appendix': ['section'],
  'doc-backlink': ['a'],
  'doc-biblioentry': ['li'],
  'doc-bibliography': ['section'],
  'doc-biblioref': ['a'],
  'doc-chapter': ['section'],
  'doc-colophon': ['section'],
  'doc-conclusion': ['section'],
  'doc-cover': ['section', 'img'], // non-standard: allow section
  'doc-credit': ['section'],
  'doc-credits': ['section'],
  'doc-dedication': ['section'],
  'doc-endnote': ['li'],
  'doc-endnotes': ['section'],
  'doc-epigraph': ['div'],
  'doc-epilogue': ['section'],
  'doc-errata': ['section'],
  'doc-example': ['aside', 'section'],
  'doc-footnote': ['aside', 'footer', 'header'],
  'doc-foreword': ['section'],
  'doc-glossary': ['section'],
  'doc-glossref': ['a'],
  'doc-index': ['nav', 'section'],
  'doc-introduction': ['section'],
  'doc-noteref': ['a'],
  'doc-notice': ['section'],
  'doc-pagebreak': ['hr'],
  'doc-pagelist': ['nav', 'section'],
  'doc-part': ['section'],
  'doc-preface': ['section'],
  'doc-prologue': ['section'],
  'doc-pullquote': ['aside', 'section'],
  'doc-qna': ['section'],
  'doc-subtitle': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  'doc-tip': ['aside'],
  'doc-toc': ['nav', 'section'],
};

export const roles = Object.keys(roleMappingTable).map((key) =>
  key.replace(/^doc-/, ''),
);
