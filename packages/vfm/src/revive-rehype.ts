import unified from 'unified';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';

import {rubyHandler} from './plugins/ruby';

export default [
  [remark2rehype, {handlers: {allowDangerousHtml: true, ruby: rubyHandler}}],
  raw,
] as unified.PluggableList<unified.Settings>;
