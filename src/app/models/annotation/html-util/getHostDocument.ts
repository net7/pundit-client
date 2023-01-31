export function getHostDocument() {
  return (window as any).Pundit_API.onGetHostDocument() || document;
}
