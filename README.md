# Woleet verification widget

This repository contains the sources code of **Woleet verification widget**.
This web widget can be used in any web application to verify with a single drag&drop the integrity and timestamp of any data anchored on the
Bitcoin blockchain (so called DAB) by Woleet or by any third party using [Chainpoint 1.0](http://www.chainpoint.org/#v1x)
compatible anchoring receipts.

# Building Woleet verification widget

Type `./build.sh` on the project's root to:
- install build tools into the `./node_modules/` directory
- install runtime dependencies into the `./bower_components/` directory
- build the libraries into the `./dist/`directory

## Limitations and Runtime dependencies

This web widget uses the [Woleet web libraries](https://github.com/woleet/woleet-weblibs) and so has the same
limitationsand runtime dependencies.

# Using Woleet web libraries

See [examples/index.html](examples/index.html) for an example of how to insert this widget in a web page.
