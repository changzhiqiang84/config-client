/*
 * @Descripttion: 
 * @Author: ChrisChung
 * @Date: 2021-11-11 21:25:57
 * @LastEditors: ChrisChung
 * @LastEditTime: 2021-11-11 23:53:58
 */
var path = require('path');

module.exports = {
  mode: 'development',

  entry: './renderer.js',

  output: {
    filename: 'renderer.js'
  },

  devtool: 'source-map',

  target: 'electron-renderer',
  // resolve: {
  //   alias: {
  //     'react-desktop': path.join(__dirname, '..', '..')
  //   }
  // },

  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
