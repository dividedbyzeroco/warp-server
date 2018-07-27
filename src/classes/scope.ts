import Error from '../utils/error';
import Class from './class';
import Function from './function';
import { AccessType } from '../types/scope';
import { _Object } from 'warp-sdk-js/typings/classes/object';
import { User } from '..';
import { InternalKeys } from '../utils/constants';

export class AccessDefinition {

    _action: AccessType;
    _context: typeof Class | typeof Function;
    _accessibility: (object?: _Object, user?: User) => boolean;

    constructor(action: AccessType, context: typeof Class | typeof Function) {
        this._action = action;
        this._context = context;
        this._accessibility = () => true;
    }

    when(accessibility: (object?: _Object, user?: User) => boolean) {
        this._accessibility = accessibility;
    }

    get action() {
        return this._action;
    }

    get context() {
        return this._context;
    }

    get accessibility() {
        return this._accessibility;
    }

}

export default class Scope {

    static _access: Array<any>;

    static get scopeName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Classes extended from `Scope` must define a static getter for scopeName');
    }

    static get description(): string {
        return `Scope for '${this.scopeName}'`;
    }

    static get access(): Array<AccessDefinition> {
        return [];
    }

    static canFind(context: typeof Class): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Find, context);
    }

    static canGet(context: typeof Class): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Get, context);
    }

    static canCreate(context: typeof Class): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Create, context);
    }

    static canUpdate(context: typeof Class): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Update, context);
    }

    static canDestory(context: typeof Class): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Destroy, context);
    }

    static canRun(context: typeof Function): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Run, context);
    }

    static canManage(context: typeof Class): AccessDefinition {
        return new AccessDefinition(InternalKeys.Access.Manage, context);
    }

    static initialize<T extends typeof Scope>(): T {
        // Map access
        this._access = this.access.reduce((map, access) => {
            // Get context class
            const contextClass = access.context;

            // Check access type
            if(new contextClass instanceof Class) {
                map[access.context.className]
            }

            // Assign scope to scope name
            map[scope.scopeName] = scope;

            // Return the map
            return map;
        }, {});

        return this as T;
    }

}