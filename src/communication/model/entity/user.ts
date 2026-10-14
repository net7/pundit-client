import { Entity } from './entity';
import { Timestamp } from './timestamp';

export interface FullName {
    firstName: string;
    lastName: string;
}
export interface UserAddress {
    location: string
}
export interface WebLinks {
    website?: string;
    linkedin?: string;
    twitter?: string
}
export interface UserAttributes {
    fullName: FullName;
    username: string;
    emailAddress: string;
    thumb?: string;
    publicProfile: boolean;
    shortBio?: string;
    address?: UserAddress;
    web?: WebLinks
    affiliation?: string
}
export type User = UserAttributes & Entity & Timestamp

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BaseUser extends Pick<User, 'id' | 'username' | 'thumb' | 'fullName'> { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PublicUserProfile extends Omit<User, 'emailAddress'> { }
