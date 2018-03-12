// @flow
/**
 * References
 */
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
    metadata: {[name: string]: any},
    currentUser: User.Class,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    metadata: {[name: string]: any},
    currentUser: User.Class,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    metadata: {[name: string]: any},
    currentUser: User.Class,
    id: number
};

export type LoginOptionsType = {
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
    sessionToken: string
};