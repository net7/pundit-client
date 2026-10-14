import { Entity } from './entity';
import { Timestamp } from './timestamp';

/**
 * Values that are always available on every notebook
 */
export interface NotebookBase {
    label: string,
    userId: string,
}

/**
 * Lists of users that have been granted access to the notebook
 */
export interface NotebookPermissions {
    userWithReadAccess?: string[],
    userWithWriteAccess?: string[]
}

/**
 * Anyone can read it's annotations.
 */
export interface PublicNotebook extends NotebookBase, NotebookPermissions {
    sharingMode: 'public',
}
/**
 * Only the owner and users that have been granted access can read it's annotations.
 */
export interface PrivateNotebook extends NotebookBase, NotebookPermissions {
    sharingMode: 'private',
}

export type SharingModeType = 'private' | 'public';
export type NotebookAttributes = PublicNotebook | PrivateNotebook;
export type Notebook = NotebookAttributes & Timestamp & Entity;
