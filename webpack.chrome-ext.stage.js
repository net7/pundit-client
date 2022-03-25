/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const prodConfig = require('./webpack.chrome-ext.prod');

module.exports = prodConfig.map((config) => ({
  ...config,
  plugins: [
    new webpack.DefinePlugin({
      API_BASE_URL: JSON.stringify('https://api.pundithomex.netseven.work'),
      FEED_PDF_BASE_URL: JSON.stringify('https://feed.thepund.it/pdf.php'),
    })
  ]
}));
