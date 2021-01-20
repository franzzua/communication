const path = require('path')

module.exports = {
    node: false,
    target: 'web',
    externals: {
        'perf_hooks': 'perf_hooks',
        'crypto': 'crypto',
        "solid-server": "solid-server",
        "express": "express",
    },
    resolve: {
        alias: {
            // "solidocity": path.resolve(__dirname, "../solidocity"),
            // "node-fetch": path.resolve(__dirname,"../solidocity/polyfills/global.js"),
            // 'solid-auth-client': `${__dirname}/node_modules/solid-auth-client/browser/index.js`,
            // 'solid-file-client': path.resolve(__dirname,"../solidocity/node_modules/solid-file-client/dist/window/solid-file-client.bundle.js"),
        }
    }
}