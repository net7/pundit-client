/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const SRC_PATH = path.resolve(__dirname, 'src');
const DIST_PATH = path.resolve(__dirname, 'dist');

module.exports = {
  entry: `${SRC_PATH}/index.ts`,
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: DIST_PATH,
  },
  devServer: {
    contentBase: DIST_PATH,
    compress: true,
    port: 4200
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/index.html', to: './' }
      ]
    })
  ]
};
