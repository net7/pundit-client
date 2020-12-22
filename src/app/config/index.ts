import { environment as env } from '../../environments/environment';

export default {
  // env
  baseUrl: env.baseUrl,
  serializer: env.serializer,
  // static config
  name: 'Pundit',
  tooltipDelay: 200,
  highlightTag: 'pnd-mark'
};
