import Class from '../features/orm/class';
import { InternalId, UpdatedAt, CreatedAt } from '../utils/constants';
import User from '../features/auth/user';

export interface ClassMapType<C extends typeof Class> { [className: string]: C; }

export interface ClassOptions<U extends User | undefined> {
    user?: U;
    master?: boolean;
}

export interface ClassKeys {
    [InternalId]?: ClassId;
    [key: string]: any;
}

export type ClassKeyMap<C extends Class> = C['keys']['toJSON'] & ClassInternalKeys;

export interface ClassInternalKeys {
    [InternalId]: ClassId;
    [CreatedAt]: string;
    [UpdatedAt]: string;
}

export type ClassJSON<C extends Class> = {
    [K in keyof ClassKeyMap<C>]?: ClassKeyMap<C>[K];
};

export type ClassId = number | string;