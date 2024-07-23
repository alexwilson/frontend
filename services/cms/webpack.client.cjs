const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const yaml = require('js-yaml')

const isProduction = (process?.env?.NODE_ENV === 'production' || false)

module.exports = {
    target: 'web',
    mode: isProduction ? 'production' : 'development',
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.yml']
    },
    entry: {
        main: './client/main.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'client.[contenthash].js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.scss$/,
                use: ['css-loader', 'sass-loader']
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
