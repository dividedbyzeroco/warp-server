// @flow
/**
 * References
 */
import WarpServer from '../index';
import User from '../classes/user';

export type FindOptionsType = {
    api: WarpServer,
    className: string,
    select: Array<string>,
    include: Array<string>,
    where: {[name: string]: {[name: string]: any}},
    sort: Array<string | {[name: string]: any}>,
    skip: number,
    limit: number
}

export type GetOptionsType = {
    api: WarpServer,
    className: string,
    id: number,
    select: Array<string>,
    include: Array<string>
};

export type CreateOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    className: string,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    className: string,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    className: string,
    id: number
};