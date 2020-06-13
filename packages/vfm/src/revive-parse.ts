import unified from 'unified';
import markdown from 'remark-parse';

import {rubyParser} from './plugins/ruby';

export default [
  [markdown, {commonmark: true}],
  [rubyParser],
] as unified.PluggableList<unified.Settings>;
