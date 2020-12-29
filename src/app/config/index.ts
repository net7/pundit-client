import { environment as env } from '../../environments/environment';

export default {
  // env
  baseURL: env.baseURL,
  serializer: env.serializer,
  chromeExt: env.chromeExt,
  // static config
  name: 'Pundit',
  tooltipDelay: 200,
  highlightTag: 'pnd-mark'
};
