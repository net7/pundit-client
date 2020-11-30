import { getNodeName } from './getNodeName';
import { getNodePosition } from './getNodePosition';

export function getPathSegment(node) {
  const name = getNodeName(node);
  const pos = getNodePosition(node);
  return `${name}[${pos}]`;
}
