const path = require('path')

module.exports = {
    target: "webworker",
    mode: 'production',
    resolve: {
        extensions: ['.js', '.json']
    },
    module: {
        rules: [{
            test: /\.html$/i,
            use: 'raw-loader'
        }]
    },
    entry: {
        main: "./worker/index.js"
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'worker.js',
    },
}
