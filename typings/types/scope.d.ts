import { AccessFind, AccessGet, AccessCreate, AccessUpdate, AccessDestroy, AccessRun } from '../utils/constants';
import User from '../classes/auth/user';
import ConstraintMap from '../utils/constraint-map';
export declare type AccessQueryType = typeof AccessFind | typeof AccessGet;
export declare type AccessMutationType = typeof AccessCreate | typeof AccessUpdate | typeof AccessDestroy;
export declare type AccessClassType = AccessQueryType | AccessMutationType;
export declare type AccessFunctionType = typeof AccessRun;
export declare type AccessType = AccessClassType | AccessFunctionType;
export declare type ClassScopeCheckerType = (query: ConstraintMap, user: User) => Promise<ConstraintMap>;
export declare type FunctionScopeCheckerType = (user: User) => Promise<boolean>;
export declare type AccessClassMapType = {
    [A in AccessClassType]: ClassScopeCheckerType | void;
};
export declare type AccessFunctionMapType = {
    [action in AccessFunctionType]: FunctionScopeCheckerType | void;
};
export declare type AccessMapType = {
    classes: {
        [name: string]: AccessClassMapType;
    };
    functions: {
        [name: string]: AccessFunctionMapType;
    };
};
