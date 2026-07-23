import { AnalyticsAction, AnalyticsData } from "src/common/types";
import { SemanticTripleType } from "@pundit/communication";

export function getAnnotationCreatedAnalytics(data: any): AnalyticsData {
  if (data.type === "Commenting") {
    return {
      action: AnalyticsAction.CommentAnnotationCreated,
      payload: { scope: "fragment" },
    };
  }
  if (data.type === "Linking") {
    const { content }: { content: SemanticTripleType[] } = data;
    return {
      action: AnalyticsAction.SemanticAnnotationCreated,
      payload: {
        scope: "fragment",
        predicate: content.map(({ predicate }) => predicate.label),
        "object-type": content.map(({ objectType }) => objectType),
        "object-lod": content.map((triple) =>
          triple.objectType === "uri" ? triple.object.label : null,
        ),
        "number-triples": content.length,
      },
    };
  }
  if (Array.isArray(data.tags) && data.tags.length) {
    return {
      action: AnalyticsAction.TagAnnotationCreated,
      payload: { scope: "fragment", tags: data.tags },
    };
  }
  throw new Error("Invalid annotation type for analytics");
}
