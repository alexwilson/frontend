const fs = require('fs');
const path = require('path')
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = function(options) {
  const localIdentName = options.production ? '[hash:base64]' : '[path]-[local]-[hash:base64:5]';
  const babelSettings = {
    presets: ['es2015']
  };
  if (options.production) {
    babelSettings.presets.push('babili');
  }
  const jsLoaders = ['babel-loader?'+JSON.stringify(babelSettings)];

  const htmlWebpackPlugin = new HtmlWebpackPlugin({
    filename: '../_includes/webpack.html',
    template: './webpack/includes.hbs',
    production: options.production,
    inject: false
  });

  const entryPoints = ['./src/js/main.js']

  const filenamePattern = `[name]${options.production?'.[hash]':''}.<EXT>`

  const plugins = [
    new MiniCssExtractPlugin({
      filename: filenamePattern.replace('<EXT>', 'css'),
      chunkFilename: options.production ? '[id].[hash].css' : '[id].css',
    }),
    htmlWebpackPlugin
  ]

  return {
    entry: options.production ? entryPoints : [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/only-dev-server',
      ...entryPoints
    ],
    devtool: options.devtool,
    output: {
      path: path.resolve(options.production ? './dist/' : './build/'),
      publicPath: options.production ? '/dist/' : 'http://localhost:8080/',
      filename: filenamePattern.replace('<EXT>', 'js'),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loaders: jsLoaders
        },
        {
          test: /\.(s*)css$/,
          use: [
            options.production ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                minimize: true,
                localIdentName,
                importLoaders: 1
              }
            },
            'postcss-loader',
            'sass-loader'
          ],
        },
        {
          test: /\.hbs$/,
          loader: 'handlebars-loader'
        },
        {
          test: /\.png$/,
          loader: "url?limit=100000&mimetype=image/png",
        },
        {
          test: /\.svg$/,
          loader: "url?limit=100000&mimetype=image/svg+xml",
        },
        {
          test: /\.gif$/,
          loader: "url?limit=100000&mimetype=image/gif",
        },
        {
          test: /\.jpg$/,
          loader: "file",
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.scss', '.css'],
    },
    optimization: {
      minimize: options.production
    },
    plugins,
  };
};
