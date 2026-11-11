import { cloneDeep } from "lodash";
import {
  AiAnnotation,
  AiAnnotationTriple,
  AiAnnotationType,
  SemanticTripleWithLiteral,
  SemanticTripleWithUri,
} from "src/communication";
import { serializeRangeToSelector } from "./annotation-range-utils";

const AI_ANNOTATION_TYPES: AiAnnotationType[] = [
  "highlight",
  "comment",
  "tags",
  "semantic_annotation",
];

type SemanticPredicate = SemanticTripleWithUri["predicate"];
type AiTripleObject = AiAnnotationTriple["object"];

/** An element object, saved like an object picked from the element search. */
function buildElementTriple(
  predicate: SemanticPredicate,
  object: AiTripleObject,
): SemanticTripleWithUri | undefined {
  if (!("uri" in object) || !object.uri) {
    return undefined;
  }
  return {
    predicate,
    objectType: "uri",
    object: {
      uri: object.uri,
      label: object.label,
      ...(object.description ? { description: object.description } : {}),
      source: "search",
      elementType: object.elementType,
    },
  };
}

/** A literal object (a date, a number, a measure), with its text trimmed. */
function buildLiteralTriple(
  predicate: SemanticPredicate,
  object: AiTripleObject,
): SemanticTripleWithLiteral | undefined {
  const text =
    "text" in object && typeof object.text === "string"
      ? object.text.trim()
      : "";
  return text ? { predicate, objectType: "literal", object: { text } } : undefined;
}

/**
 * Semantic content of an AI triple. An element object is saved like an object
 * picked from the element search; a literal object (a date, a number, a
 * measure) is saved as a literal, with its text trimmed.
 * Undefined when the predicate has no URI, or the object has neither a URI
 * nor a non-empty text.
 */
export function buildSemanticContent(
  triple?: AiAnnotationTriple,
): (SemanticTripleWithUri | SemanticTripleWithLiteral)[] | undefined {
  const { predicate, object } = triple ?? {};
  if (!predicate?.uri || !object) {
    return undefined;
  }
  const semanticPredicate = { label: predicate.label, uri: predicate.uri };
  const content =
    buildElementTriple(semanticPredicate, object) ??
    buildLiteralTriple(semanticPredicate, object);
  return content ? [content] : undefined;
}

/**
 * Sets type, content and tags of the payload from the AI annotation; its
 * `type` decides, the requested type when it is missing or unknown.
 * Returns false when the annotation lacks the content of its type.
 */
export function applyAnnotationType(
  payload: any,
  annotation: AiAnnotation,
  requestedType: AiAnnotationType,
): boolean {
  const type =
    AI_ANNOTATION_TYPES.find((t) => t === annotation.type) ?? requestedType;
  payload.tags = undefined;
  switch (type) {
    case "comment":
      if (!annotation.comment) {
        return false;
      }
      payload.type = "Commenting";
      // already HTML-escaped by the server
      payload.content = { comment: annotation.comment };
      return true;
    case "tags": {
      const tags = (annotation.tags ?? []).filter(
        (tag) => typeof tag === "string" && tag !== "",
      );
      if (!tags.length) {
        return false;
      }
      payload.type = "Highlighting";
      payload.content = undefined;
      // already normalized by the server
      payload.tags = tags;
      return true;
    }
    case "semantic_annotation": {
      const content = buildSemanticContent(annotation.triple);
      if (!content) {
        return false;
      }
      payload.type = "Linking";
      payload.content = content;
      return true;
    }
    default:
      payload.type = "Highlighting";
      payload.content = undefined;
      return true;
  }
}

/**
 * The preview payload of an AI annotation placed on `range`: a copy of the
 * pending annotation payload with the range as its selection.
 * Null when the annotation lacks the content of its type.
 */
export function addPayloadForRange(
  range: Range,
  annotation: AiAnnotation,
  annotationPayload: any,
  requestedType: AiAnnotationType,
): any | null {
  if (!annotationPayload) {
    return null;
  }
  const payload = cloneDeep(annotationPayload);
  if (!applyAnnotationType(payload, annotation, requestedType)) {
    return null;
  }
  payload.subject = {
    ...payload.subject,
    selected: serializeRangeToSelector(range),
  };
  return payload;
}
