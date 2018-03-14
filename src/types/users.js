// @flow
/**
 * References
 */
import Warp from 'warp-sdk-js';
import User from '../classes/user';

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
    Warp: Warp,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    Warp: Warp,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    Warp: Warp,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    id: number
};

export type LoginOptionsType = {
    Warp: Warp,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    username: string,
    email: string,
    password: string
};

export type MeOptionsType = {
    currentUser: User.Class
};

export type LogoutOptionsType = {
    Warp: Warp,
    sessionToken: string
};