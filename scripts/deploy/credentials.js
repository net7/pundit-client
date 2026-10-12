const fs = require('fs');
const path = require('path');
const { CWS_VARS, ENVIRONMENTS } = require('./config');

const ENV_FILE = path.join(__dirname, '../.deploy.env');

// Variables already set in the environment win over the file (process.loadEnvFile semantics).
// Values are never printed, only variable names.
const loadCredentials = (env) => {
  if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
  const { extensionIdVar } = ENVIRONMENTS[env];
  const missing = [...CWS_VARS, extensionIdVar].filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing ${missing.join(', ')}: set them in scripts/.deploy.env (see scripts/.deploy.env.example) or in the environment`);
  }
  return {
    clientId: process.env.CWS_CLIENT_ID,
    clientSecret: process.env.CWS_CLIENT_SECRET,
    refreshToken: process.env.CWS_REFRESH_TOKEN,
    publisherId: process.env.CWS_PUBLISHER_ID,
    itemId: process.env[extensionIdVar],
  };
};

module.exports = { loadCredentials };
