import { AiAnnotateErrorCode, AiAnnotateErrorResponse } from "src/communication";

/** Backend error codes with a dedicated message (i18n key toast#ai_error_<code>). */
const AI_ERROR_CODES: AiAnnotateErrorCode[] = [
  "payload_too_large",
  "no_active_api_key",
  "invalid_api_key",
  "provider_quota_exceeded",
  "provider_rate_limited",
  "provider_timeout",
  "provider_unavailable",
  "provider_host_not_found",
  "provider_url_blocked",
  "structured_output_unsupported",
  "model_unavailable",
  "invalid_structured_output",
  "no_predicates",
  "no_elements",
  "ontology_too_large",
];

/**
 * Code for a response without a known code, from its HTTP status: these can also
 * come from a proxy (e.g. nginx) or the backend's own limits, with no JSON body.
 */
const AI_ERROR_CODE_BY_STATUS: Record<number, AiAnnotateErrorCode> = {
  413: "payload_too_large",
  429: "provider_rate_limited",
  504: "provider_timeout",
};

export const getAiErrorCode = (error: any): AiAnnotateErrorCode | undefined => {
  const code = (error?.response?.data as AiAnnotateErrorResponse | undefined)
    ?.code;
  const known = AI_ERROR_CODES.find((c) => c === code);
  return known ?? AI_ERROR_CODE_BY_STATUS[error?.response?.status];
};

/** AI error toasts stay 2 s longer than the default (3 s), to give time to read them. */
export const AI_ERROR_TOAST_DELAY = 5000;

/** Error codes the user fixes in the AI settings (API key, provider, model). */
export const AI_SETTINGS_ERROR_CODES: AiAnnotateErrorCode[] = [
  "no_active_api_key",
  "invalid_api_key",
  "provider_quota_exceeded",
  "provider_unavailable",
  "provider_host_not_found",
  "provider_url_blocked",
  "structured_output_unsupported",
  "model_unavailable",
  "invalid_structured_output",
];

/** Error codes of semantic annotations the user fixes in the Ontologies panel. */
export const AI_ONTOLOGY_ERROR_CODES: AiAnnotateErrorCode[] = [
  "no_predicates",
  "no_elements",
  "ontology_too_large",
];
