declare module '*.svg' {
  const content: string;
  export default content;
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string;
  }
}

declare module 'remark-rehype' {
  import {Plugin} from 'unified';
  const plugin: Plugin;
  export default plugin;
}

declare module 'rehype-raw' {
  import {Plugin} from 'unified';
  const plugin: Plugin;
  export default plugin;
}

declare module 'rehype-stringify' {
  import {Plugin} from 'unified';
  const plugin: Plugin;
  export default plugin;
}

declare module 'remark-math';
declare module 'rehype-mathjax';
declare module 'hast-util-find-and-replace';
declare module 'hastscript';
declare module 'hast-util-is-element';
declare module 'remark-breaks';

declare module 'mdast-util-to-hast/lib/all';
