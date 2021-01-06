const path = require('path')

module.exports = {
    node: false,
    target: 'web',
    externals: {
        'perf_hooks': 'window',
        'crypto': 'window'
    },
    resolve: {
        alias: {
            "solidocity": path.resolve(__dirname, "../solidocity/dist/worker.js")
        }
    }
}