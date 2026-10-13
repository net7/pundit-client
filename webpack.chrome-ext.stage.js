const webpack = require("webpack");
const prodConfig = require("./webpack.chrome-ext.prod");

// Default: ambiente stage netseven. In un deployment locale il file
// src/environments/chrome-ext-urls.stage.js (generato da
// pundit-deployment/scripts/render-env.sh, gitignored) sovrascrive gli URL
// con i domini locali, in coerenza con local.stage.ts.
let urls = {
  API_BASE_URL: "https://api.thepund.netseven.work",
  FEED_PDF_BASE_URL: "https://feed.thepund.netseven.work/pdf.php?source=",
  FEED_WEB_BASE_URL: "https://feed.thepund.netseven.work/?url=",
};
try {
  urls = { ...urls, ...require("./src/environments/chrome-ext-urls.stage.js") };
} catch (e) {
  // file non generato: si usano i default stage
}

module.exports = prodConfig.map((config) => ({
  ...config,
  plugins: [
    new webpack.DefinePlugin({
      API_BASE_URL: JSON.stringify(urls.API_BASE_URL),
      FEED_PDF_BASE_URL: JSON.stringify(urls.FEED_PDF_BASE_URL),
      FEED_WEB_BASE_URL: JSON.stringify(urls.FEED_WEB_BASE_URL),
    }),
  ],
}));
