/* eslint-disable @typescript-eslint/camelcase */
import manifest from './manifest';

export default {
  ...manifest,
  name: 'Pundit Annotator (stage)',
  browser_action: {
    ...manifest.browser_action,
    default_icon: 'assets/icons/pundit-icon-red-38.png',
  },
};
