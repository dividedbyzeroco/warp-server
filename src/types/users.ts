import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import { MetadataType } from './class';

export type FindOptionsType = {
    select?: Array<string>,
    include?: Array<string>,
    where?: {[name: string]: {[name: string]: any}},
    sort?: Array<string | {[name: string]: any}>,
    skip?: number,
    limit?: number
}

export type GetOptionsType = {
    id: number,
    select?: Array<string>,
    include?: Array<string>
};

export type CreateOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    id: number
};

export type LoginOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    username?: string,
    email?: string,
    password: string
};

export type MeOptionsType = {
    currentUser?: User
};

export type LogoutOptionsType = {
    Warp: Warp,
    sessionToken: string
};