import { cloneDeep } from "lodash";
import { serializeRangeToSelector } from "./annotation-range-utils";

export function buildLabelUri(label: string): string {
  const base = "http://www.w3.org/2000/01/rdf-schema#";
  const map: Record<string, string> = {
    identifies: "isDefinedBy",
    "is related to": "isRelatedTo",
    describes: "describes",
    "has author": "hasAuthor",
    "has type": "hasType",
    cites: "cites",
    quotes: "quotes",
    "replies to": "repliesTo",
    "represents the date": "representsTheDate",
  };
  const prop = map[label] || label;
  return `${base}${prop}`;
}

export function buildSemanticContent(triple: any): any[] | undefined {
  if (!triple?.label) {
    return undefined;
  }
  return [
    {
      predicate: {
        label: triple.label,
        uri: buildLabelUri(triple.label),
      },
      objectType: triple.objectType || "literal",
      object: triple.object || { text: "" },
    },
  ];
}

const SEMANTIC_TYPES = new Set([
  "semanticannotation",
  "semantic annotation",
  "semantic_annotation",
  "linking",
]);

export function applyAnnotationType(
  payload: any,
  annotationType?: string,
  commentText?: string,
  tags?: string[],
  triple?: any,
): void {
  const normType = annotationType ? annotationType.toLowerCase().trim() : "";
  if (normType === "commenting" || normType === "comment") {
    payload.type = "Commenting";
    payload.content = { comment: commentText || "" };
  } else if (SEMANTIC_TYPES.has(normType)) {
    payload.type = "Linking";
    payload.content = buildSemanticContent(triple);
  } else {
    payload.type = "Highlighting";
    payload.content = undefined;
  }
  payload.tags = tags && tags.length ? tags : undefined;
}

export function addPayloadForRange(
  startNode: Text,
  startIndex: number,
  endIndex: number,
  annotationPayload: any,
  newPayloads: any[],
  annotationType?: string,
  commentText?: string,
  tags?: string[],
  triple?: any,
  endNode: Text = startNode,
): void {
  const finalRange = document.createRange();
  finalRange.setStart(startNode, startIndex);
  finalRange.setEnd(endNode, endIndex);
  const selected = serializeRangeToSelector(finalRange);

  if (!annotationPayload) {
    console.error("[mapChunks] ERRORE: annotationPayload è undefined!");
    return;
  }

  const newPayload = cloneDeep(annotationPayload);
  newPayload.subject = { ...newPayload.subject, selected };
  applyAnnotationType(newPayload, annotationType, commentText, tags, triple);
  newPayloads.push(newPayload);
}
