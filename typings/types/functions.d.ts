import User from '../classes/auth/user';
import Function from '../classes/function';
export declare type FunctionOptionsType = {
    user?: User | null;
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
    functionName: string;
    keys?: {
        [name: string]: any;
    };
    user: User | null;
};
