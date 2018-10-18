import Scope from './scope';
import { AccessMapType, AccessType } from '../../types/scope';
import { Class, Function, User } from '../..';
import ConstraintMap from '../../utils/constraint-map';
export default class Role {
    static _scopes: {
        [scopeName: string]: typeof Scope;
    };
    _access: AccessMapType;
    _currentUser: User;
    _sessionScopes: Array<string>;
    static readonly roleName: string;
    static readonly scopes: Array<typeof Scope>;
    static readonly inherits: Array<typeof Role>;
    static initialize<T extends typeof Role>(): T;
    statics<T extends typeof Role>(): T;
    setUser(user: User): void;
    setSessionScopes(scopes: Array<string>): void;
    has(scopeName: string): boolean;
    can(action: AccessType, context: new () => Class | Function, where?: ConstraintMap): Promise<boolean | ConstraintMap>;
}
