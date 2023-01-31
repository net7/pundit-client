export function getHostDocumentBody() {
  return (window as any).Pundit_API.onGetHostDocumentBody() || document.body;
}
