import Class from '../features/orm/class';
import { InternalId } from '../utils/constants';
import User from '../features/auth/user';

export interface ClassMapType<C extends typeof Class> { [className: string]: C; }

export interface ClassOptions<U extends User | undefined> {
    user?: U;
    master?: boolean;
}

export interface ClassKeys {
    [InternalId]?: number;
    [key: string]: any;
}

export type ClassJSON<C extends Class> = { [K in keyof C]?: C[K] };