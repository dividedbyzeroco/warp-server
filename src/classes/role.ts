import Error from '../utils/error';
import Scope from './scope';
import { AccessMapType, AccessType } from '../types/scope';
import { Class, Function, User } from '..';
import ConstraintMap from '../utils/constraint-map';
import { AccessFind, AccessGet, AccessCreate, AccessUpdate, AccessDestroy, AccessRun } from '../utils/constants';

export default class Role {

    static _scopes: { [scopeName: string]: typeof Scope };
    _access: AccessMapType = { classes: {}, functions: {} };
    _currentUser: User;
    _sessionScopes: Array<string>;

    static get roleName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Classes extended from `Role` must define a static getter for roleName');
    }

    static get scopes(): Array<typeof Scope> {
        return [];
    }

    static get inherits(): Array<typeof Role> {
        return [];
    }

    static initialize<T extends typeof Role>(): T {

        // Inherit scopes
        const inheritedScopes = this.inherits.reduce((map, role) => {
            // Extend scopes
            map = { ...map, ...role._scopes }; 

            // Return the map
            return map;
        }, {});

        // Map scopes
        const mappedScopes = this.scopes.reduce((map, scope) => {
            // Assign scope to scope name
            map[scope.scopeName] = scope;

            // Return the map
            return map;
        }, {});

        // Set scopes
        this._scopes = { ...inheritedScopes, ...mappedScopes };

        return this as T;
    }
    
    statics<T extends typeof Role>(): T {
        return this.constructor as T;
    }

    setUser(user: User) {
        this._currentUser = user;
    }

    setSessionScopes(scopes: Array<string>) {
        this._sessionScopes = scopes;

        // Get allowed scopes
        const allowedScopes = scopes.map(scopeName => this.statics()._scopes[scopeName]);

        // Map access
        allowedScopes.forEach(scope => {
            this._access.classes = { ...this._access.classes, ...scope._access.classes };
            this._access.functions = { ...this._access.functions, ...scope._access.functions };
        });
    }

    has(scopeName: string) {
        return typeof this.statics()._scopes[scopeName] !== 'undefined' && this._sessionScopes.includes(scopeName);
    }
    
    async can(action: AccessType, context: new() => Class | Function, where: ConstraintMap = new ConstraintMap) {

        // Get context instance
        const contextInstance = new context;
            
        if(contextInstance instanceof Class) {
            // Ensure that the action is applicable
            if(action !== AccessFind
                && action !== AccessGet
                && action !== AccessCreate
                && action !== AccessUpdate
                && action !== AccessDestroy) 
                    throw new Error(Error.Code.ForbiddenOperation, 'Operation is not allowed on classes');

            const checker = this._access.classes[contextInstance.statics().className][action];
            if(typeof checker === 'undefined') return where;
            return await checker(where, this._currentUser);

        }
        else if(contextInstance instanceof Function) {
            // Ensure that the action is applicable
            if(action !== AccessRun) 
                throw new Error(Error.Code.ForbiddenOperation, 'Operation is not allowed on functions');

            const checker = this._access.functions[contextInstance.statics().functionName][action];
            if(typeof checker === 'undefined') return false;
            return await checker(this._currentUser);
        }
        
        // Return false if not a class or function
        throw new Error(Error.Code.ForbiddenOperation, 'Operations can only be made on classes and functions')
    }
}