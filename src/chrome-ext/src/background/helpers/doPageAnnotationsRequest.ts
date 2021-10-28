import { AnnotationModel } from '../../../../common/models';

export const doPageAnnotationsRequest = (tabId, documentUrl) => (
  AnnotationModel.search(documentUrl)
    .then((response) => Promise.resolve({
      tabId,
      response
    }))
);
