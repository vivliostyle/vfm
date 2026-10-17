// Corpus builders: Markdown inputs taken from the test files of `packages/`,
// from the fenced `md` / `markdown` blocks of the VFM documentation, and from
// Markdown files on disk (for example a book written in VFM).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { stripIndent } from 'common-tags';
import ts from 'typescript';

/**
 * @typedef {object} CorpusEntry
 * @property {string} id - Where the input comes from (`path:line`).
 * @property {string} markdown - Markdown source.
 */

/**
 * Functions whose first argument is a Markdown input in the test files.
 */
const INPUT_CALLEES = new Set([
  'buildProcessorTestingCode',
  'buildHtmlTestingCode',
  'stringify',
  'readMetadata',
  'processSync',
  'render',
]);

/**
 * Read the cooked text of a literal-like expression: a string literal, a
 * template literal without substitutions, or a `stripIndent` tagged template.
 * @param {ts.Node} node - Expression.
 * @returns {string | undefined} Text, or `undefined` for anything else.
 */
const literalText = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (
    ts.isTaggedTemplateExpression(node) &&
    ts.isIdentifier(node.tag) &&
    node.tag.text === 'stripIndent' &&
    ts.isNoSubstitutionTemplateLiteral(node.template)
  ) {
    return stripIndent(node.template.text);
  }
  return undefined;
};

/**
 * Collect the Markdown inputs of one vitest file: the first argument of the
 * calls in {@link INPUT_CALLEES}, given as a literal or as a variable that was
 * initialized with a literal earlier in the file.
 * @param {string} file - Path of the test file.
 * @param {string} root - Repository root, used for the entry ids.
 * @returns {CorpusEntry[]} Inputs in source order.
 */
export const fromTestFile = (file, root) => {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  /** @type {Array<{ name: string, pos: number, text: string }>} */
  const declarations = [];
  /**
   * Record every variable that is initialized with a literal.
   * @param {ts.Node} node - Current node.
   */
  const collectDeclarations = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const text = literalText(node.initializer);
      if (text !== undefined) {
        declarations.push({ name: node.name.text, pos: node.pos, text });
      }
    }
    ts.forEachChild(node, collectDeclarations);
  };
  collectDeclarations(source);

  /**
   * Resolve an argument to its Markdown text.
   * @param {ts.Node} node - Argument expression.
   * @returns {string | undefined} Text, or `undefined` when it is not static.
   */
  const resolve = (node) => {
    const text = literalText(node);
    if (text !== undefined) return text;
    if (ts.isIdentifier(node)) {
      const candidates = declarations.filter(
        (d) => d.name === node.text && d.pos < node.pos,
      );
      return candidates.at(-1)?.text;
    }
    return undefined;
  };

  /** @type {CorpusEntry[]} */
  const entries = [];
  /**
   * Record the first argument of every recognized call.
   * @param {ts.Node} node - Current node.
   */
  const collectCalls = (node) => {
    if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : undefined;
      if (name !== undefined && INPUT_CALLEES.has(name)) {
        const markdown = resolve(node.arguments[0]);
        if (markdown !== undefined) {
          const { line } = source.getLineAndCharacterOfPosition(
            node.getStart(),
          );
          entries.push({ id: `${relative(root, file)}:${line + 1}`, markdown });
        }
      }
    }
    ts.forEachChild(node, collectCalls);
  };
  collectCalls(source);

  return entries;
};

/**
 * Collect the fenced ```` ```md ```` / ```` ```markdown ```` blocks of a
 * documentation file as inputs.
 * @param {string} file - Path of the Markdown document.
 * @param {string} root - Repository root, used for the entry ids.
 * @returns {CorpusEntry[]} One entry per block.
 */
export const fromDocument = (file, root) => {
  /** @type {CorpusEntry[]} */
  const entries = [];
  /** @type {number | undefined} */
  let openedAt;
  /** @type {string[]} */
  let buffer = [];
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (openedAt === undefined) {
        if (/^```(md|markdown)\s*$/.test(line)) {
          openedAt = index + 1;
          buffer = [];
        }
        return;
      }
      if (/^```\s*$/.test(line)) {
        entries.push({
          id: `${relative(root, file)}:${openedAt}`,
          markdown: `${buffer.join('\n')}\n`,
        });
        openedAt = undefined;
        return;
      }
      buffer.push(line);
    });
  return entries;
};

/**
 * List the files under a path, recursively, skipping `node_modules`.
 * @param {string} path - File or directory.
 * @returns {string[]} File paths.
 */
const listFiles = (path) => {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path)
    .filter((name) => name !== 'node_modules' && !name.startsWith('.'))
    .flatMap((name) => listFiles(join(path, name)));
};

/**
 * Collect whole Markdown files as inputs. The entry id is the last path
 * segment of the given path followed by the path inside it, so that a corpus
 * outside the repository still reads well in the report.
 * @param {string[]} paths - Files or directories.
 * @returns {CorpusEntry[]} One entry per `.md` file.
 */
export const fromMarkdownFiles = (paths) =>
  paths.flatMap((path) =>
    listFiles(path)
      .filter((file) => extname(file) === '.md')
      .map((file) => ({
        id:
          file === path
            ? basename(path)
            : `${basename(path)}/${relative(path, file)}`,
        markdown: readFileSync(file, 'utf8'),
      })),
  );

/**
 * Collect the inputs of every `*.test.ts` file in the `tests` directory of each
 * package under `<root>/packages`.
 * @param {string} root - Repository root.
 * @returns {CorpusEntry[]} Inputs.
 */
export const fromPackageTests = (root) => {
  const packages = join(root, 'packages');
  return readdirSync(packages)
    .map((name) => join(packages, name, 'tests'))
    .filter((dir) => statSync(dir, { throwIfNoEntry: false })?.isDirectory())
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((name) => name.endsWith('.test.ts'))
        .map((name) => join(dir, name)),
    )
    .flatMap((file) => fromTestFile(file, root));
};

/**
 * Drop entries whose Markdown was already seen, keeping the first id.
 * @param {CorpusEntry[]} entries - Inputs.
 * @returns {CorpusEntry[]} Unique inputs.
 */
export const dedupe = (entries) => {
  const seen = new Set();
  return entries.filter(({ markdown }) => {
    if (seen.has(markdown)) return false;
    seen.add(markdown);
    return true;
  });
};
