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

declare module 'mdast-util-to-hast/lib/all';
