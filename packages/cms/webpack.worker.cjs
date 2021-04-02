module.exports = {
    target: "webworker",
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
    }
}