import { Warp } from 'warp-sdk-js';
import User from '../classes/user';
import Function from '../classes/function';
import { MetadataType } from './class';
export declare type FunctionOptionsType = {
    metadata?: MetadataType;
    currentUser?: User;
    keys?: {
        [name: string]: any;
    };
};
export declare type FunctionMethodsType = {
    add: (functions: FunctionMapType) => void;
    get: (functionName: string) => typeof Function;
};
export declare type FunctionMapType = {
    [functionName: string]: typeof Function;
};
export declare type RunOptionsType = {
    Warp: Warp;
    metadata: MetadataType;
    currentUser?: User;
    functionName: string;
    keys?: {
        [name: string]: any;
    };
};
