import { _t } from "@net7/core";
import { EditModalParams } from "src/app/types";
import { Annotation } from "src/communication";

/** Annotation types the AI can propose for the whole page: a highlight is its passage. */
export const AI_PAGE_ANNOTATION_TYPES = ["comment", "tags", "semantic_annotation"];

/** The AI modal on the page: titled with the page title (or URL), instructions and the page types. */
export const getAiPageModalParams = (pendingAnnotation: Annotation): EditModalParams => ({
  textQuote: pendingAnnotation.subject.pageTitle || pendingAnnotation.subject.pageContext,
  sections: [{
    id: "aiRequest",
    required: true,
    focus: true,
    options: {
      label: _t("editmodal#ai_label"),
      annotationTypes: AI_PAGE_ANNOTATION_TYPES,
    },
  }],
});
