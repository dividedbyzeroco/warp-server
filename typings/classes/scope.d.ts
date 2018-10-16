import Class from './class';
import Function from './function';
import { AccessMapType, AccessType, ClassScopeCheckerType, FunctionScopeCheckerType, AccessClassType, AccessFunctionType } from '../types/scope';
export declare class AccessDefinition {
    _action: AccessType;
    _context: new () => Class | Function;
    _accessibility: ClassScopeCheckerType | FunctionScopeCheckerType;
    constructor(action: AccessType, context: typeof Class | typeof Function);
    readonly action: AccessType;
    readonly context: new () => Class | Function;
    readonly accessibility: ClassScopeCheckerType | FunctionScopeCheckerType;
    when(accessibility: ClassScopeCheckerType | FunctionScopeCheckerType): void;
}
export declare class AccessClassDefinition extends AccessDefinition {
    _action: AccessClassType;
    _accessibility: ClassScopeCheckerType;
    constructor(action: AccessClassType, context: typeof Class);
    when(accessibility: ClassScopeCheckerType): void;
}
export declare class AccessFunctionDefinition extends AccessDefinition {
    _action: AccessFunctionType;
    _accessibility: FunctionScopeCheckerType;
    constructor(action: AccessFunctionType, context: typeof Function);
    when(accessibility: FunctionScopeCheckerType): void;
}
export default class Scope {
    static _access: AccessMapType;
    static readonly scopeName: string;
    static readonly description: string;
    static readonly access: Array<any>;
    static canFind(context: typeof Class): AccessClassDefinition;
    static canGet(context: typeof Class): AccessClassDefinition;
    static canCreate(context: typeof Class): AccessClassDefinition;
    static canUpdate(context: typeof Class): AccessClassDefinition;
    static canDestroy(context: typeof Class): AccessClassDefinition;
    static canManage(context: typeof Class): Array<AccessClassDefinition>;
    static canRun(context: typeof Function): AccessFunctionDefinition;
    static initialize<T extends typeof Scope>(): T;
}
