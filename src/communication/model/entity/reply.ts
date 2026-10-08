import { Entity, Timestamp } from '.';

export interface ReplyAttributes {
    userId: string;
    annotationId: string;
    type: 'Comment';
    comment: string;
    parentId?: string
}

export type Reply = ReplyAttributes & Entity & Timestamp;
