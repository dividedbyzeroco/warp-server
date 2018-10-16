import { AccessFind, AccessGet, AccessCreate, AccessUpdate, AccessDestroy, AccessRun } from '../utils/constants';
import User from '../classes/user';
import ConstraintMap from '../utils/constraint-map';

export type AccessQueryType = typeof AccessFind | typeof AccessGet;
export type AccessMutationType = typeof AccessCreate | typeof AccessUpdate | typeof AccessDestroy;
export type AccessClassType = AccessQueryType | AccessMutationType;
export type AccessFunctionType = typeof AccessRun;
export type AccessType = AccessClassType | AccessFunctionType;

export type ClassScopeCheckerType = (query: ConstraintMap, user: User) => Promise<ConstraintMap>;
export type FunctionScopeCheckerType = (user: User) => Promise<boolean>;

export type AccessClassMapType = {
    [A in AccessClassType]: ClassScopeCheckerType | void
};

export type AccessFunctionMapType = {
    [action in AccessFunctionType]: FunctionScopeCheckerType | void
};

export type AccessMapType = {
    classes: {
        [name: string]: AccessClassMapType
    },
    functions: {
        [name: string]: AccessFunctionMapType
    }
};