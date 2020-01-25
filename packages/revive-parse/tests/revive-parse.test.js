"use strict";

import reviveParse from "../src/index";
const unified = require("unified");

it("needs tests", () => {
  const tree = unified()
    .use(reviveParse)
    .parse("# Hello world!");
  console.log(tree);
});
