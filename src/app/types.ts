export type LayoutEvent = {
  type: string;
  payload?: any;
}

interface AnchorHref {
  href: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
}

interface AnchorPayload {
  payload: any;
}

export type Anchor = AnchorHref | AnchorPayload;

export type Icon = {
  id: string;
  payload?: any;
}

export interface NavItem {
  text: string;
  classes?: string;
  anchor?: Anchor;
  _meta?: any;
}

export interface NavData {
  items: NavItem[];
  classes?: string;
  payload?: any;
  _meta?: any;
}

// ------------------------------------ //
// # TYPE GUARDS
// ------------------------------------ //

export function isAnchorHref(anchor: Anchor): anchor is AnchorHref {
  return (anchor as AnchorHref).href !== undefined;
}

export function isAnchorPayload(anchor: Anchor): anchor is AnchorPayload {
  return (anchor as AnchorPayload).payload !== undefined;
}
