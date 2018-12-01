import { User } from '..';
import { ClassId } from './class';

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
    id: ClassId;
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
    id: ClassId;
    keys: {[name: string]: any};
    user: User | null;
}

export interface DestroyOptionsType {
    className: string;
    id: ClassId;
    user: User | null;
}