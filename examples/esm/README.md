# ESM

This is a sample of using VFM as an ESM package.

## Setup

1. Run the `npm pack` command in the root directory of VFM project
2. Move the generated `vivliostyle-vfm-x.x.x.tgz` file to this project directory
3. Run `npm i vivliostyle-vfm-x.x.x.tgz` command in this project directory

## Run

Run the example with `npm start`.

```shell
$ npm start

> vfm-esm@1.0.0 start
> node src/index.js

<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Hello, VFM!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <section class="level1">
      <h1 id="hello-vfm">Hello, VFM!</h1>
      <p>This is a simple example of using VFM to render Markdown to HTML.</p>
    </section>
  </body>
</html>
```