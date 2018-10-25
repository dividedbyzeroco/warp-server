import Function from '../features/functions/function';
import { User } from '..';

export type FunctionMapType<F extends typeof Function> = { [functionName: string]: F };

export type RunOptionsType = {
    functionName: string,
    keys?: {[name: string]: any},
    user: User | null
};