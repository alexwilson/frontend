'use strict';

var gulp = require("gulp");
var path = require("path");
var webpack = require("webpack-stream");
var streamify = require("gulp-streamify");
var uglify = require("gulp-uglify");
var BowerWebpackPlugin = require('bower-webpack-plugin');

gulp.task('default', function() {
    return;
});


gulp.task('buildJs', function() {

  var webpackConfig = {
    resolve: {
        root: [
            path.join(__dirname, "node_modules"),
            path.join(__dirname, "bower_components")
        ]
    },
    plugins: [
        new BowerWebpackPlugin()
    ],
    output: {
      filename: "bundle.js"
    }
  };

  var src = [
    path.join(__dirname, "/src/js/main.js")
  ];

  var stream = gulp.src(src)
    .pipe(webpack(webpackConfig))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(path.join(__dirname, "/bundle/")));
  return stream;
  
});
