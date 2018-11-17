import User from '../features/auth/user';

export interface FindOptionsType {
    select?: string[];
    include?: string[];
    where?: {[name: string]: {[name: string]: any}};
    sort?: Array<string | {[name: string]: any}>;
    skip?: number;
    limit?: number;
}

export interface GetOptionsType {
    id: number;
    select?: string[];
    include?: string[];
}

export interface CreateOptionsType {
    currentUser?: User;
    keys: {[name: string]: any};
}

export interface UpdateOptionsType {
    currentUser?: User;
    id: number;
    keys: {[name: string]: any};
}

export interface DestroyOptionsType {
    currentUser?: User;
    id: number;
}