module.exports = {
    node: false,
    target: 'web',
    externals: {
        'perf_hooks': 'window',
        'crypto': 'window'
    },
}