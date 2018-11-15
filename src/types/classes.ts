import { User } from '..';

export type FindOptionsType = {
    className: string,
    select?: Array<string>,
    include?: Array<string>,
    where?: {[name: string]: {[name: string]: any}},
    sort?: Array<string>,
    skip?: number,
    limit?: number,
    user: User | null
}

export type GetOptionsType = {
    className: string,
    id: number,
    select?: Array<string>,
    include?: Array<string>,
    user: User | null
};

export type CreateOptionsType = {
    className: string,
    keys: {[name: string]: any},
    user: User | null
};

export type UpdateOptionsType = {
    className: string,
    id: number,
    keys: {[name: string]: any},
    user: User | null
};

export type DestroyOptionsType = {
    className: string,
    id: number,
    user: User | null
};