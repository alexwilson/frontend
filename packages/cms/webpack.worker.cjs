module.exports = {
    target: "webworker",
    resolve: {
        extensions: ['.js', '.json']
    },
    entry: {
        main: "./worker/index.js"
    }
}