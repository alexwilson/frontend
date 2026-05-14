const path = require('path')

module.exports = {
    target: "webworker",
    mode: 'production',
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.html$/i,
                use: 'raw-loader'
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        configFile: false,
                        presets: [
                            require.resolve('@babel/preset-env'),
                            require.resolve('@babel/preset-typescript'),
                        ],
                    },
                }]
            }
        ]
    },
    entry: {
        main: "./worker/index.ts"
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'worker.js',
    },
}
