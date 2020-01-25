import remark2rehype from "remark-rehype";

import * as ruby from "revive-parse/lib/syntax/ruby";

export default [[remark2rehype, { handlers: { ruby: ruby.handler } }]];
