import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import Function from '../classes/function';
import { MetadataType } from './class';

export type FunctionOptionsType = {
    metadata?: MetadataType,
    currentUser?: User,
    keys?: {[name: string]: any}
};

export type FunctionMethodsType = {
    add: (functions: FunctionMapType) => void,
    get: (functionName: string) =>  typeof Function
};

export type FunctionMapType = {[functionName: string]: typeof Function};

export type RunOptionsType = {
    Warp: Warp,
    metadata: MetadataType,
    currentUser?: User,
    functionName: string,
    keys?: {[name: string]: any}
};