import { Observable, Subject } from 'rxjs';

export type AppEventData = {
  type: string;
  payload?: any;
}

export interface AnchorHref {
  href: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
}

export interface AnchorPayload {
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

export interface LayoutHandler {
  listen: () => void;
}

export type FormSectionPayload<T> = {
  id: string;
  value: T;
  errors?: string[];
}

export type FormSectionData<T, U> = {
  changed$: Subject<FormSectionPayload<T>>;
  initialValue?: T;
  options?: U;
  required?: boolean;
  focus?: boolean;
}

export type EditModalParams = {
  textQuote: string;
  saveButtonLabel?: string;
  sections: {
    id: string;
    value?: unknown;
    options?: unknown;
    required?: boolean;
    focus?: boolean;
  }[];
  validation?: {
    required?: {
      condition: 'AND' | 'OR';
    };
  };
}

export interface FormSection<T, U> {
  id: string;
  data: FormSectionData<T, U>;
  reset$: Subject<void>;
}

export type SemanticItem = {
  label: string;
  uri: string;
  description?: string;
  providerId?: string;
}

export interface SemanticProvider {
  id: string;
  label: string;
  items: SemanticItem[];
  selected: SemanticItem;
  get: (uri: string) => SemanticItem;
  search: (query?: string) => Observable<SemanticItem[]>;
  setSelected: (uri: string) => void;
}

export type SemanticConfig = {
  default: string;
  providers: SemanticProvider[];
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
