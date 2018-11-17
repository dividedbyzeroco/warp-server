import { User } from '..';

export interface FindOptionsType {
    className: string;
    select?: string[];
    include?: string[];
    where?: {[name: string]: {[name: string]: any}};
    sort?: string[];
    skip?: number;
    limit?: number;
    user: User | null;
}

export interface GetOptionsType {
    className: string;
    id: number;
    select?: string[];
    include?: string[];
    user: User | null;
}

export interface CreateOptionsType {
    className: string;
    keys: {[name: string]: any};
    user: User | null;
}

export interface UpdateOptionsType {
    className: string;
    id: number;
    keys: {[name: string]: any};
    user: User | null;
}

export interface DestroyOptionsType {
    className: string;
    id: number;
    user: User | null;
}