import Function from '../features/functions/function';
import { User } from '..';

export type FunctionMapType<F extends typeof Function> = { [functionName: string]: F };

export type FunctionOptions<U extends User | undefined> = {
    user?: U,
    master?: boolean
};

export type RunOptionsType = {
    functionName: string,
    keys?: {[name: string]: any},
    user: User | null
};