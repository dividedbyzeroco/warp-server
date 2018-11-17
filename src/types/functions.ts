import Function from '../features/functions/function';
import { User } from '..';

export interface FunctionMapType<F extends typeof Function> { [functionName: string]: F; }

export interface FunctionOptions<U extends User | undefined> {
    user?: U;
    master?: boolean;
}

export interface RunOptionsType {
    functionName: string;
    keys?: {[name: string]: any};
    user: User | null;
}