# Woleet verification widget

This repository contains the sources code of **Woleet verification widget**.
This web widget can be easily embedded into any web application to:
- **verify** the **existence** and get the **timestamp** of a **file** anchored in the Bitcoin blockchain using any [Chainpoint 1 or 2](http://www.chainpoint.org) compatible tool.</li>
- **verify** the **existence**, the **validity** and get the **timestamp** of a **signature** anchored in the Bitcoin blockchain using Woleet's <a href="https://medium.com/@woleet/beyond-data-anchoring-bee867d9be3a">signature anchoring</a> extension to [Chainpoint 1 or 2](http://www.chainpoint.org/) (the signee identity is also verified if provided)</li>

# Building Woleet verification widget

Type `./build.sh` on the project's root to:
- install build tools and runtime dependencies into the `./node_modules/` directory
- build the libraries into the `./dist/`directory

# Using Woleet verification widget

## Limitations and Runtime dependencies

This web widget uses the [Woleet web libraries](https://github.com/woleet/woleet-weblibs) and so has the same
[limitations](https://github.com/woleet/woleet-weblibs#limitations) and [runtime dependencies](https://github.com/woleet/woleet-weblibs#runtime-dependencies).

## Installation

You can use npm to add Woleet web libraries to your project:

```bash
npm i @woleet/woleet-widget
```
***In this documentation, it is supposed that npm is used to install Woleet verification widget.***

## Initialization

To use the Woleet verification widget you have to include the following components:

```html
<link href="./node_modules/@woleet/woleet-widget/dist/style.css" rel="stylesheet">
<script src="./node_modules/@woleet/woleet-widget/dist/woleet-widget.js"></script>
<script src="./node_modules/@woleet/woleet-weblibs/dist/woleet-weblibs.js"></script>
```

or their minimized equivalent:

```html
<link href="./node_modules/@woleet/woleet-widget/dist/style.css" rel="stylesheet">
<script src="./node_modules/@woleet/woleet-widget/dist/woleet-widget.min.js"></script>
<script src="./node_modules/@woleet/woleet-weblibs/dist/woleet-weblibs.min.js"></script>
```

## Basic usage

See [examples/index.html](examples/index.html) for examples about how to insert this widget in a web page.

To insert the Woleet verification widget into a web page, create a `<div>` of the `woleet-widget class:

```html
<div class="woleet-widget"></div>
```

If you want the widget to automatically verify a given file/hash, specify the hash to verify in the `data-hash`property:

```html
<div class="woleet-widget" data-hash="6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d"></div>
```
