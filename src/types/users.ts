import { Warp } from 'warp-sdk-js';
import { UserClass } from '../classes/user';
import { MetadataType } from './model';

export type FindOptionsType = {
    select: Array<string>,
    include: Array<string>,
    where: {[name: string]: {[name: string]: any}},
    sort: Array<string | {[name: string]: any}>,
    skip: number,
    limit: number
}

export type GetOptionsType = {
    id: number,
    select: Array<string>,
    include: Array<string>
};

export type CreateOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser: UserClass,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser: UserClass,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser: UserClass,
    id: number
};

export type LoginOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser: UserClass,
    username: string,
    email: string,
    password: string
};

export type MeOptionsType = {
    currentUser: UserClass
};

export type LogoutOptionsType = {
    Warp: Warp,
    sessionToken: string
};