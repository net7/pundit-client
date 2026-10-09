/**
 * An annotation proposed by the LLM. The shape comes from the model's
 * tool calls (keys may be camelCase or snake_case), so it is left open.
 */
export type AiAnnotateCall = Record<string, any>;

/**
 * Each field is either an array or its JSON-encoded string.
 */
export interface AiAnnotateResponse {
  result?: AiAnnotateCall[] | string;
  contiguous_chunks?: AiAnnotateCall[] | string;
}

/**
 * Error codes the backend sends for failures the user can act on.
 */
export type AiAnnotateErrorCode =
  | 'payload_too_large'
  | 'no_active_api_key'
  | 'structured_output_unsupported'
  | 'model_unavailable'
  | 'invalid_structured_output';

/**
 * Error body: `error` is a human-readable (Italian) message,
 * `message` the provider's detail when available.
 */
export interface AiAnnotateErrorResponse {
  error: string;
  code?: AiAnnotateErrorCode;
  message?: string;
}
