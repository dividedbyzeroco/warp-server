import { Warp } from 'warp-sdk-js';
import User from '../classes/auth/user';
export declare type FindOptionsType = {
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
    id: number;
    select?: Array<string>;
    include?: Array<string>;
};
export declare type CreateOptionsType = {
    Warp?: Warp;
    currentUser?: User;
    keys: {
        [name: string]: any;
    };
};
export declare type UpdateOptionsType = {
    Warp?: Warp;
    currentUser?: User;
    id: number;
    keys: {
        [name: string]: any;
    };
};
export declare type DestroyOptionsType = {
    Warp?: Warp;
    currentUser?: User;
    id: number;
};
export declare type LoginOptionsType = {
    Warp?: Warp;
    currentUser?: User;
    username?: string;
    email?: string;
    password: string;
};
export declare type MeOptionsType = {
    currentUser?: User;
};
export declare type LogoutOptionsType = {
    Warp: Warp;
    accessToken: string;
};
