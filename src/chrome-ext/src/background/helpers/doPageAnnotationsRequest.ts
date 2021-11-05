import { AnnotationModel } from '../../../../common/models';

export const doPageAnnotationsRequest = (tabId, { pageContext, pageMetadata }) => (
  AnnotationModel.search(pageContext, pageMetadata)
    .then((response) => Promise.resolve({
      tabId,
      response
    }))
);
