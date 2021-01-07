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
            "solidocity": path.resolve(__dirname, "../solidocity/dist/worker.js")
        }
    }
}