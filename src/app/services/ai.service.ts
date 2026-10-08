import { Injectable } from '@angular/core';
import {
  AiAnnotateCall, AiAnnotateRequest, AiAnnotateResponse
} from 'src/communication';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AiModel } from 'src/common/models';

export type AiAnnotateResult = {
  toolCalls: AiAnnotateCall[];
  contiguousCalls: AiAnnotateCall[];
};

@Injectable({
  providedIn: 'root'
})
export class AiService {
  /**
   * Ask the backend LLM to annotate the given chunks.
   * Errors (HTTP or network) are propagated to the caller.
   */
  annotate(request: AiAnnotateRequest): Observable<AiAnnotateResult> {
    return from(AiModel.annotate(request)).pipe(
      map(({ data }) => ({
        toolCalls: this.toCallList(data?.result, 'result'),
        contiguousCalls: this.toCallList(data?.contiguous_chunks, 'contiguous_chunks'),
      }))
    );
  }

  /** Response fields may be arrays or JSON-encoded arrays. */
  private toCallList(value: AiAnnotateResponse['result'], field: string): AiAnnotateCall[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        console.error(`[AiService] invalid JSON in "${field}"`, value);
      }
    }
    return [];
  }
}
