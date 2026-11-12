import { Injectable } from '@angular/core';
import { AiAnnotateRequest, AiAnnotation } from 'src/communication';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AiModel } from 'src/common/models';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  /**
   * Ask the backend to annotate the given segments: the proposed annotations,
   * each with its position, in the order received ([] when the list is missing).
   * Errors (HTTP or network) are propagated to the caller.
   */
  annotate(request: AiAnnotateRequest): Observable<AiAnnotation[]> {
    return from(AiModel.annotate(request)).pipe(
      map(({ data }) => (Array.isArray(data?.annotations) ? data.annotations : []))
    );
  }
}
