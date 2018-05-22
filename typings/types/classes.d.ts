import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import { MetadataType } from './class';
export declare type FindOptionsType = {
    className: string;
    select?: Array<string>;
    include?: Array<string>;
    where?: {
        [name: string]: {
            [name: string]: any;
        };
    };
    sort?: Array<string | {
        [name: string]: any;
    }>;
    skip?: number;
    limit?: number;
};
export declare type GetOptionsType = {
    className: string;
    id: number;
    select?: Array<string>;
    include?: Array<string>;
};
export declare type CreateOptionsType = {
    Warp?: Warp;
    metadata: MetadataType;
    currentUser?: User;
    className: string;
    keys: {
        [name: string]: any;
    };
};
export declare type UpdateOptionsType = {
    Warp?: Warp;
    metadata: MetadataType;
    currentUser?: User;
    className: string;
    id: number;
    keys: {
        [name: string]: any;
    };
};
export declare type DestroyOptionsType = {
    Warp?: Warp;
    metadata: MetadataType;
    currentUser?: User;
    className: string;
    id: number;
};
