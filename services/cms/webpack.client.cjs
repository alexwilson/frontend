const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const yaml = require('js-yaml')
const sass = require('sass')

const isProduction = (process?.env?.NODE_ENV === 'production' || false)

module.exports = {
    target: 'web',
    mode: isProduction ? 'production' : 'development',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.yml'],
        alias: {
          'clean-stack': false,
          ajv$: path.resolve(__dirname, 'node_modules/ajv'),
        },
        fallback: {
          path: require.resolve("path-browserify"),
          stream: require.resolve("stream-browserify")
        },
    },
    entry: {
        main: './client/main.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'client.[contenthash].js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        configFile: false,
                        presets: [
                            require.resolve('@babel/preset-env'),
                            [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
                            require.resolve('@babel/preset-typescript'),
                        ],
                    },
                }]
            },
            {
                test: /\.scss$/,
                use: [
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            api: 'modern',
                            sassOptions: {
                                importers: [new sass.NodePackageImporter()],
                            },
                        },
                    },
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.yml/,
                type: 'json',
                parser: {
                    parse: yaml.load
                }
            }
        ]
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            'CMS_BACKEND': null,
        }),
        new HtmlWebpackPlugin({
            title: 'Alex CMS',
            publicPath: isProduction ? 'https://static.alexwilson.tech/cms/' : 'auto'
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static'
        })
    ],
    devServer: {
        static: {
          directory: path.join(__dirname, 'dist'),
        },
        port: 9000,
    }
}
