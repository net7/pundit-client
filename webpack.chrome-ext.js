/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const common = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.chrome-ext.json'
          }
        }],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
};

module.exports = [{
  entry: `${path.resolve(__dirname, 'src')}/chrome-ext/src/content/main.ts`,
  output: {
    filename: 'content.bundle.js',
    path: path.resolve(__dirname, 'dist/chrome-ext-tmp/'),
  },
  ...common
}, {
  entry: `${path.resolve(__dirname, 'src')}/chrome-ext/src/background/main.ts`,
  output: {
    filename: 'background.bundle.js',
    path: path.resolve(__dirname, 'dist/chrome-ext-tmp/'),
  },
  ...common
}];