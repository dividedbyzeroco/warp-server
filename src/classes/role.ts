import Error from '../utils/error';
import Scope from './scope';

export default class Role {

    static _scopes: { [scopeName: string]: typeof Scope };

    static get roleName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Classes extended from `Role` must define a static getter for roleName');
    }

    static get scopes(): Array<typeof Scope> {
        return [];
    }

    static initialize<T extends typeof Role>(): T {
        // Map scopes
        this._scopes = this.scopes.reduce((map, scope) => {
            // Assign scope to scope name
            map[scope.scopeName] = scope;

            // Return the map
            return map;
        }, {});

        return this as T;
    }
    
    statics<T extends typeof Role>(): T {
        return this.constructor as T;
    }

    can(scopeName: string) {
        return typeof this.statics()._scopes[scopeName] !== 'undefined';
    }
}