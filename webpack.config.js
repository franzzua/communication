const path = require('path')
const webpack = require('webpack');
module.exports = {
    node: {
        process: true,
        os: true
    },
    target: 'web',
    externals: {
        'perf_hooks': 'perf_hooks',
        'crypto': 'crypto',
        "solid-server": "solid-server",
        "express": "express"
    },
    module: {
        rules: [
            {
                test: /\.svg$/,
                loader: 'string-loader',
            },
        ]
    },
    resolve: {
        alias: {
            "solidocity": path.resolve(__dirname, "../solidocity/dist/esm/index.js"),
            "@m-ld/m-ld": path.resolve(__dirname, "../m-ld-js"),
            "@m-ld/m-ld$": path.resolve(__dirname, "../m-ld-js"),
            // "node-fetch": path.resolve(__dirname,"../solidocity/polyfills/global.js"),
            // 'solid-auth-client': `${__dirname}/node_modules/solid-auth-client/browser/index.js`,
            // 'solid-file-client': path.resolve(__dirname,"../solidocity/node_modules/solid-file-client/dist/window/solid-file-client.bundle.js"),
        }
    }
}
