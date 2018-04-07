import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import { FunctionClass } from '../classes/function';
import { MetadataType } from './class';

export type FunctionOptionsType = {
    metadata?: MetadataType,
    currentUser?: User,
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
    currentUser?: User,
    functionName: string,
    keys?: {[name: string]: any}
};