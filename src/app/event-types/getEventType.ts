export function getEventType(event: string): string {
  const eventPrefix = event.split('.')[0];
  return event.replace(`${eventPrefix}.`, '');
}
