import {
  Anchor,
  QuerySelectorOptions,
} from '../types';

export async function querySelector(
  handler: Anchor,
  options: QuerySelectorOptions = {}
): Promise<Range> {
  return handler.toRange(options);
}
