# MitmProxy 

A NPM wrapper for [MitmProxy](https://mitmproxy.org/) v2.

## Usage

```javascript
const mitmproxy = require('mitmproxy');

mitmproxy.start(args).then(() => {
    // mitmproxy is launched 
});

mitmproxy.stop();
```

## Debug

Simply set `NODE_DEBUG` environment variable to include `mitmproxy`.

## Sideload mitmproxy binaries

Setup `MITMPROXY_FILEPATH` environment variable to the mitmproxy archive.

You can also set the `mitmproxy_filepath` variable into `.npmrc`.
