import { Entity } from './entity';
import { Timestamp } from './timestamp';

export type SocialType = 'Like' | 'Dislike' | 'Report' | 'Endorse'
export interface SocialAttributes {
    userId: string;
    annotationId: string;
    type: SocialType;
    parentId?: string;
}

export type Social = SocialAttributes & Entity & Timestamp;
