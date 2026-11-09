import { EditModalFormState } from "src/app/components/edit-modal/edit-modal";

export class EditModalPayloadBuilder {
  static applyFormValuesToPayload(
    annotationPayload: any,
    formState: EditModalFormState,
  ): void {
    this.applyNotebookValue(annotationPayload, formState?.notebook?.value);
    this.applyCommentValue(
      annotationPayload,
      formState?.comment?.value,
      formState?.semantic?.value,
    );
    this.applyTagsValue(annotationPayload, formState?.tags?.value);
  }

  private static applyNotebookValue(
    annotationPayload: any,
    notebook: any,
  ): void {
    if (notebook) {
      annotationPayload.notebookId = notebook;
    }
  }

  private static applyCommentValue(
    annotationPayload: any,
    commentValue: any,
    semantic: any,
  ): void {
    const comment =
      typeof commentValue === "string" ? commentValue.trim() : null;

    if (Array.isArray(semantic) && semantic.length) {
      annotationPayload.type = "Linking";
      annotationPayload.content = semantic.map((row) =>
        this.getSemanticContentRow(row),
      );
    } else if (comment) {
      annotationPayload.type = "Commenting";
      annotationPayload.content = { comment };
    } else {
      annotationPayload.type = "Highlighting";
      annotationPayload.content = undefined;
    }
  }

  private static applyTagsValue(annotationPayload: any, tags: any): void {
    if (Array.isArray(tags)) {
      annotationPayload.tags = tags.length ? tags : undefined;
    }
  }

  private static getSemanticContentRow(row: any) {
    const { predicate, object, objectType } = row;
    // a row the user did not edit is saved exactly as it was stored
    if (row?._raw) {
      return row._raw;
    }
    const objectPayload = this.getObjectPayload(object, objectType);
    return {
      predicate: {
        label: predicate.label,
        uri: predicate.uri,
      },
      ...objectPayload,
    };
  }

  private static getObjectPayload = (object: any, objectType: string) => {
    if (objectType === "literal") {
      return { objectType, object: { text: object.label } };
    }
    if (objectType === "uri" && object?.source === "search") {
      const { uri, label, elementType, rdfTypes } = object;
      return {
        objectType,
        object: {
          uri,
          label,
          source: "search",
          ...(elementType ? { elementType } : {}),
          ...(rdfTypes?.length ? { rdfTypes } : {}),
        },
      };
    }
    if (objectType === "uri") {
      return {
        objectType,
        object: {
          uri: object.label,
          source: "free-text",
        },
      };
    }
    return {};
  };
}
