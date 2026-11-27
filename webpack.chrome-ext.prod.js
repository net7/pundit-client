const path = require('path');
const webpack = require('webpack');

/**
 * The application's address, the shape of `authBaseUrl` in local.example.ts:
 * the API address without its trailing `api` (`https://host/api` gives `https://host/`).
 */
const authBaseUrlOf = (apiBaseUrl) => {
  const authBaseUrl = apiBaseUrl.replace(/api\/?$/, '');
  if (authBaseUrl === apiBaseUrl) {
    throw new Error(`API_BASE_URL must end with "api": ${apiBaseUrl}`);
  }
  return authBaseUrl;
};

const API_BASE_URL = 'https://app.thepund.it/api';

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
    // Mirror tsconfig `baseUrl: './'` so absolute imports like `src/communication` resolve.
    modules: [path.resolve(__dirname), 'node_modules'],
  },
  plugins: [
    new webpack.DefinePlugin({
      API_BASE_URL: JSON.stringify(API_BASE_URL),
      AUTH_BASE_URL: JSON.stringify(authBaseUrlOf(API_BASE_URL)),
      // maintenance status of the client, read by the background (empty: no status read)
      STATUS_URL: JSON.stringify('https://app.thepund.it/api/client-status'),
      FEED_PDF_BASE_URL: JSON.stringify('https://feed.thepund.it/pdf.php?source='), // https://feed.thepund.it/pdf.php?source=<pdf>
      FEED_WEB_BASE_URL: JSON.stringify('https://feed.thepund.it/?url='), // https://feed.thepund.it/?url=<url>
    })
  ]
};

const configs = [{
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
}, {
  entry: `${path.resolve(__dirname, 'src')}/chrome-ext/src/site-access/main.ts`,
  output: {
    filename: 'site-access.bundle.js',
    path: path.resolve(__dirname, 'dist/chrome-ext-tmp/'),
  },
  ...common
}];

// The stage build reuses the configurations and the derivation of the auth address.
configs.authBaseUrlOf = authBaseUrlOf;
module.exports = configs;
