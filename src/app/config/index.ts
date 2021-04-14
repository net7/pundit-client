import { environment as env } from '../../environments/environment';

export default {
  // env
  ...env,
  // static config
  name: 'Pundit',
  tooltipDelay: 200,
  highlightTag: 'pnd-mark',
  toastTimer: 500,
  indexUpdateDelay: 1500, // elastic-search index update delay
};
