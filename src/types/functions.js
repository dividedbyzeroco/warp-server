// @flow
/**
 * References
 */
import User from '../classes/user';
import Function from '../classes/function';
import type { MetadataType } from './model';

export type FunctionOptionsType = {
    metadata: MetadataType,
    currentUser: User.Class,
    keys?: {[name: string]: any}
};

export type FunctionMethodsType = {
    add: (functions: FunctionMapType) => void,
    get: (functionName: string) =>  typeof Function.Class
};

export type FunctionMapType = {[functionName: string]: typeof Function.Class};

export type RunOptionsType = {
    metadata: MetadataType,
    currentUser: User.Class,
    functionName: string,
    keys?: {[name: string]: any}
};