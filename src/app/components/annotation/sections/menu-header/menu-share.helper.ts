import { _t } from '@net7/core';
import { _c } from 'src/app/models/config';

const annotationDerefUrl = (id) => {
  const baseDereferenceURL = _c('baseDereferenceURL');
  const path = `html/annotation/${id}`;
  return new URL(path, baseDereferenceURL).toString();
};

const buildUrl = (id: string, source: 'twitter' | 'facebook') => {
  let url;
  const derefURL = encodeURIComponent(annotationDerefUrl(id));
  switch (source) {
    case 'facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${derefURL}`;
      break;
    case 'twitter':
      url = `https://twitter.com/intent/tweet?url=${derefURL}`;
      break;
    default:
      break;
  }
  return url;
};

export const shareButton = (id) => ({
  id: 'share',
  payload: {
    id,
    source: 'menu-share',
  },
});

export const shareActionButtons = (config: { id }) => {
  const { id } = config;
  const actions = [
    {
      label: _t('share#twitter'),
      type: 'link',
      payload: {
        url: buildUrl(id, 'twitter'),
      },
    },
    {
      label: _t('share#facebook'),
      type: 'link',
      payload: {
        url: buildUrl(id, 'facebook'),
      },
    },
    {
      label: _t('share#copy'),
      type: 'action',
      payload: {
        id,
        data: annotationDerefUrl(id),
        source: 'copy-url',
      },
    },
  ];

  return actions;
};
