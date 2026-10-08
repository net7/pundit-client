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
