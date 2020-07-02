// derived from remark-sectionize
// https://github.com/jake-low/remark-sectionize
// MIT License
// original: 2019 Jake Low
// modified: 2020 Yasuaki Uechi

import { Parent } from 'mdast';
import findAfter from 'unist-util-find-after';
import visit from 'unist-util-visit-parents';
import { roleMappingTable, roles } from '../utils/wai-aria';

const MAX_HEADING_DEPTH = 6;

export function plugin() {
  return (tree: any) => {
    for (let depth = MAX_HEADING_DEPTH; depth > 0; depth--) {
      visit(
        tree,
        (node: any) => {
          return node.type === 'heading' && node.depth === depth;
        },
        sectionize as any,
      );
    }
  };
}

function sectionize(node: any, ancestors: Parent[]) {
  const start = node;
  const depth = start.depth;
  const parent = ancestors[ancestors.length - 1];

  const isEnd = (node: any) =>
    (node.type === 'heading' && node.depth <= depth) || node.type === 'export';
  const end = findAfter(parent, start, isEnd);

  const startIndex = parent.children.indexOf(start);
  const endIndex = parent.children.indexOf(end);

  const between = parent.children.slice(
    startIndex,
    endIndex > 0 ? endIndex : undefined,
  );

  let type = 'section';

  const hProperties = node.data?.hProperties;
  if (hProperties) {
    node.data.hProperties = {};

    const props = Object.keys(hProperties);

    // {hidden} specifier
    if (props.includes('hidden')) {
      node.data.hProperties.style = 'display: none;';
    }

    // {@toc} specifier
    const ariaProp = props
      .filter((prop) => prop.startsWith('@'))
      .map((id) => id.slice(1))
      .find((key) => roles.includes(key));
    if (ariaProp) {
      const role = `doc-${ariaProp}`;
      type = roleMappingTable[role][0];
      hProperties.role = role;
      delete hProperties['@' + ariaProp];
    }
  }

  const isDuplicated = parent.type === 'section';
  if (isDuplicated) {
    if (parent.data?.hProperties) {
      parent.data.hProperties = {
        ...(parent.data.hProperties as any),
        ...hProperties,
      };
    }
    return;
  }

  const section = {
    type,
    data: {
      hName: type,
      hProperties,
    },
    depth: depth,
    children: between,
  } as any;

  parent.children.splice(startIndex, section.children.length, section);
}
