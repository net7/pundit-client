/* eslint-disable @typescript-eslint/camelcase */
export default {
  name: 'Pundit Annotator',
  version: '{{ version }}',
  description: 'Annotate the web using Pundit Annotator: highlight and comment text on any page and manage your annotations in the Pundit Dashboard.',
  manifest_version: 2,
  icons: {
    16: 'assets/icons/icon16.png',
    48: 'assets/icons/pundit-icon-48-close.png',
    128: 'assets/icons/pundit-icon-128-close.png'
  },
  background: {
    scripts: ['background.js']
  },
  content_scripts: [
    {
      matches: ['*://*/*'],
      js: ['content.js'],
      run_at: 'document_end'
    }
  ],
  browser_action: {
    default_icon: 'assets/icons/pundit-icon-38.png',
    default_title: 'Launch Pundit Annotator'
  },
  web_accessible_resources: [
    'pundit.chrome-ext.js',
    'assets/mocks/pundit-icon-48-light.png',
    'pundit-icon/*'
  ],
  permissions: ['activeTab', 'storage']
};
