import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, ReplyAttributes } from '../model';
import { CommunicationSettings } from '../services';

/**
 * Updates a reply's comment. `parentId` and `userId` are refused by the BE API.
 */
const update = (
  id: string,
  { comment, type, annotationId }: ReplyAttributes
): AxiosPromise<UpdateResponse> => request$(`/reply/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data: {
    comment,
    ...(type ? { type } : {}),
    ...(annotationId ? { annotationId } : {}),
  },
});
export default update;
