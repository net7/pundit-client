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

type SemanticContentTriple = SemanticTripleWithUri | SemanticTripleWithLiteral;
type SemanticSubject = Pick<SemanticContentTriple, "subjectType" | "subject">;

/**
 * Subject of an AI triple, saved like a subject picked from the element
 * search; empty (the annotated fragment, or the page) when it has no URI.
 */
function buildSubject(subject?: AiAnnotationTriple["subject"]): SemanticSubject {
  if (!subject || typeof subject !== "object" || !subject.uri) {
    return {};
  }
  return {
    subjectType: "uri",
    subject: {
      uri: subject.uri,
      label: subject.label,
      ...(subject.description ? { description: subject.description } : {}),
      source: "search",
      elementType: subject.elementType,
    },
  };
}

/**
 * Semantic triple of an AI triple, undefined when the predicate has no URI,
 * or the object has neither a URI nor a non-empty text.
 */
function buildSemanticTriple(
  triple?: AiAnnotationTriple,
): SemanticContentTriple | undefined {
  const { subject, predicate, object } = triple ?? {};
  if (!predicate?.uri || !object) {
    return undefined;
  }
  const semanticPredicate = { label: predicate.label, uri: predicate.uri };
  const semanticTriple =
    buildElementTriple(semanticPredicate, object) ??
    buildLiteralTriple(semanticPredicate, object);
  return semanticTriple && { ...buildSubject(subject), ...semanticTriple };
}

/**
 * Semantic content of the AI triples of one place of the text, in their
 * order: the triples about the passage first, then those about an ontology
 * element, grouped by subject as received (never sorted here).
 * An element subject or object is saved like one picked from the element
 * search; a literal object (a date, a number, a measure) is saved as a
 * literal, with its text trimmed. A subject without URI leaves the triple
 * about the annotated fragment.
 * A triple whose predicate has no URI, or whose object has neither a URI nor
 * a non-empty text, is left out; undefined when no triple is left.
 */
export function buildSemanticContent(
  triples?: AiAnnotationTriple[],
): SemanticContentTriple[] | undefined {
  const content = (Array.isArray(triples) ? triples : [])
    .map((triple) => buildSemanticTriple(triple))
    .filter((triple): triple is SemanticContentTriple => !!triple);
  return content.length ? content : undefined;
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
      const content = buildSemanticContent(annotation.triples);
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

/**
 * The preview payload of an AI annotation on the page (`target: null`): a copy
 * of the pending page annotation payload with the content of the annotation,
 * its `subject` left as it is (no selection).
 * Null when the annotation lacks the content of its type.
 */
export function addPayloadForPage(
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
  return payload;
}
