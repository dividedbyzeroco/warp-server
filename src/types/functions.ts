import Warp from 'warp-sdk-js';
import { UserClass } from '../classes/user';
import { FunctionClass } from '../classes/function';
import { MetadataType } from './model';

export type FunctionOptionsType = {
    metadata?: MetadataType,
    currentUser?: UserClass,
    keys?: {[name: string]: any}
};

export type FunctionMethodsType = {
    add: (functions: FunctionMapType) => void,
    get: (functionName: string) =>  typeof FunctionClass
};

export type FunctionMapType = {[functionName: string]: typeof FunctionClass};

export type RunOptionsType = {
    Warp: Warp,
    metadata: MetadataType,
    currentUser: UserClass,
    functionName: string,
    keys?: {[name: string]: any}
};