## Why

AI-generated preview annotations (ids prefixed `ai-preview-`) are rendered in the sidebar with the same card as saved annotations, so they expose the owner's menu (edit, change notebook, delete), the share button and the social bar (like, reply). These actions call the backend with a fake id and fail or leave inconsistent state. The only way to drop an unwanted suggestion today is to discard all previews at once with "Cancel" in the AI modal.

## What Changes

- Preview cards no longer show any action that reaches the backend: no actions menu (⋮), no share button, no social bar (likes, replies). The collapse/expand control stays.
- Preview cards get a **Discard** button (✕), visible both collapsed and expanded, that removes that single preview: its highlight anchor, its cached sidebar annotation and its payload.
- "Save all" in the AI modal saves only the previews still present. When the last preview is discarded, "Save all" becomes disabled, as when no previews exist.
- Preview tracking in the AI handler moves from an index-based array to a map keyed by preview id, so removing one preview does not break the removal of the others.
- No backend changes.

## Capabilities

### New Capabilities

- `ai-preview-annotations`: how AI-generated preview annotations behave in the sidebar before being saved — which actions they expose, discarding a single preview, and how "Save all" reflects the previews left.

### Modified Capabilities

None.

## Impact

- Affected code: `main-layout-edit-modal-ai.handler.ts` (preview map, `discardAiPreview`), `main-layout-edit-modal.handler.ts` (listens to the discard app event), `annotation.html`/`annotation.ts` (discard button, hide social section), `menu-header-section.ts` (no menu/share data for previews), `annotation.eh.ts` and `sidebar-layout-annotation.handler.ts` (new discard event), `app.events.ts` and annotation event types, `en_US.ts`, `_annotation.scss`, specs.
- New shared helper `isAiPreviewId` replacing the `startsWith('ai-preview-')` checks scattered in templates and services.
- Server: none.
