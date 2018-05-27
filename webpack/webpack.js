const fs = require('fs');
const path = require('path')
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

function extractForProduction(loaders) {
  return ExtractTextPlugin.extract('style', loaders.substr(loaders.indexOf('!')));
}

module.exports = function(options) {
  options.lint = fs.existsSync(__dirname + '/../.eslintrc') && options.lint !== false;

  var localIdentName = options.production ? '[hash:base64]' : '[path]-[local]-[hash:base64:5]';
  var cssLoaders = 'style!css?localIdentName=' + localIdentName + '!autoprefixer?browsers=last 2 versions';
  var scssLoaders = cssLoaders + '!sass';
  var sassLoaders = scssLoaders + '?indentedSyntax=sass';

  if (options.production) {
    cssLoaders = extractForProduction(cssLoaders);
    sassLoaders = extractForProduction(sassLoaders);
    scssLoaders = extractForProduction(scssLoaders);
  }

  var babelSettings = {
    presets: ['es2015']
  };
  if (options.production) {
    babelSettings.presets.push('babili');
  }
  var jsLoaders = ['babel?'+JSON.stringify(babelSettings)];

  var htmlWebpackPlugin = new HtmlWebpackPlugin({
    filename: '../_includes/webpack.html',
    template: './webpack/includes.hbs',
    production: options.production,
    inject: false
  });

  return {
    entry: options.production ? './src/js/main.js' : [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/only-dev-server',
      './src/js/main.js',
    ],
    devtool: options.devtool,
    output: {
      path: path.resolve(options.production ? './dist/' : './build/'),
      publicPath: options.production ? '/dist/' : 'http://localhost:8080/',
      filename: options.production ? 'app.[hash].js' : 'app.js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loaders: jsLoaders
        },
        {
          test: /\.css$/,
          loader: cssLoaders,
        },
        {
          test: /\.sass$/,
          loader: sassLoaders,
        },
        {
          test: /\.scss$/,
          loader: scssLoaders,
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
      minimize: true
    },
    plugins: options.production ? [
      // Important to keep React file size down
      new webpack.DefinePlugin({
        "process.env": {
          "NODE_ENV": JSON.stringify("production"),
        },
      }),
      new ExtractTextPlugin("app.[hash].css"),
      htmlWebpackPlugin
    ] : [
      htmlWebpackPlugin
    ],
  };
};
