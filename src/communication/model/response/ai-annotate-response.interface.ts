import { ObjectUriElementType } from '../entity/triple';
import { AiAnnotationType } from '../request/ai-annotate-request.interface';

/**
 * Where an annotation sits in the segments of the request.
 * `start` is an offset in the `segment` node, `end` (exclusive) in the
 * `end_segment` node or, when null, in `segment`; both in UTF-16 code units,
 * i.e. DOM Range offsets on the text nodes. Both are null when the passage
 * occurs more than once in the segment and the server could not tell which:
 * the client then anchors with `exact`, `prefix` and `suffix`.
 */
export type AiAnnotationTarget = {
  segment: string;
  end_segment: string | null;
  exact: string;
  prefix: string;
  suffix: string;
  start: number | null;
  end: number | null;
};

/** An object of a triple that is an element of the user's ontologies. */
export type AiAnnotationElementObject = {
  uri: string;
  label: string;
  description?: string;
  elementType: ObjectUriElementType;
};

/**
 * An object of a triple that is a literal value read from the text (a date,
 * a number, a measure). Dates come as YYYY-MM-DD, YYYY-MM or YYYY.
 */
export type AiAnnotationLiteralObject = {
  text: string;
};

/**
 * A triple whose predicate is an element of the user's ontologies and whose
 * object is either an element of those ontologies or a literal value.
 */
export type AiAnnotationTriple = {
  predicate: { uri: string; label: string };
  object: AiAnnotationElementObject | AiAnnotationLiteralObject;
};

/**
 * An annotation proposed by the AI, one per position. `comment` (already
 * HTML-escaped), `tags` (already normalized) and `triple` come with their type.
 */
export type AiAnnotation = {
  type: AiAnnotationType;
  target: AiAnnotationTarget;
  comment?: string;
  tags?: string[];
  triple?: AiAnnotationTriple;
};

export interface AiAnnotateResponse {
  annotations: AiAnnotation[];
}

/**
 * Error codes the backend sends for failures the user can act on.
 */
export type AiAnnotateErrorCode =
  | 'payload_too_large'
  | 'no_active_api_key'
  | 'invalid_api_key'
  | 'provider_quota_exceeded'
  | 'provider_rate_limited'
  | 'provider_timeout'
  | 'provider_unavailable'
  | 'provider_host_not_found'
  | 'provider_url_blocked'
  | 'structured_output_unsupported'
  | 'model_unavailable'
  | 'invalid_structured_output'
  | 'no_predicates'
  | 'no_elements'
  | 'ontology_too_large';

/**
 * Error body: `error` is a human-readable (Italian) message,
 * `message` the provider's detail when available.
 */
export interface AiAnnotateErrorResponse {
  error: string;
  code?: AiAnnotateErrorCode;
  message?: string;
}
