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

export interface ClassJSON {
    [InternalId]?: ClassId;
    [name: string]: any;
}

export type ClassId = number | string;