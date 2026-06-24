module.exports = {
    target: "webworker",
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    entry: {
        main: "./src/index.ts"
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }]
    }
}