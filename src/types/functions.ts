import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import Function from '../classes/function';
import { MetadataType } from './class';

export type FunctionOptionsType = {
    user: User | null
    keys?: {[name: string]: any}
};

export type FunctionMethodsType = {
    add: (functions: FunctionMapType) => void,
    get: (functionName: string) =>  typeof Function
};

export type FunctionMapType = {[functionName: string]: typeof Function};

export type RunOptionsType = {
    functionName: string,
    keys?: {[name: string]: any},
    user: User | null
};