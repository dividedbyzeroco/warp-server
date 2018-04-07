import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import { MetadataType } from './class';

export type FindOptionsType = {
    className: string,
    select?: Array<string>,
    include?: Array<string>,
    where?: {[name: string]: {[name: string]: any}},
    sort?: Array<string | {[name: string]: any}>,
    skip?: number,
    limit?: number
}

export type GetOptionsType = {
    className: string,
    id: number,
    select?: Array<string>,
    include?: Array<string>
};

export type CreateOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    className: string,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    className: string,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    Warp?: Warp,
    metadata: MetadataType,
    currentUser?: User,
    className: string,
    id: number
};