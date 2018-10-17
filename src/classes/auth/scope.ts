import Error from '../../utils/error';
import Class from '../class';
import Function from '../function';
import { AccessMapType, AccessType, ClassScopeCheckerType, FunctionScopeCheckerType, AccessClassType, AccessFunctionType } from '../../types/scope';
import { AccessFind, AccessGet, AccessCreate, AccessUpdate, AccessDestroy, AccessRun } from '../../utils/constants';
import ConstraintMap from '../../utils/constraint-map';
import { getHeapStatistics } from 'v8';

export class AccessDefinition {
    _action: AccessType;
    _context: new() => Class | Function;
    _accessibility: ClassScopeCheckerType | FunctionScopeCheckerType;

    constructor(action: AccessType, context: typeof Class | typeof Function) {
        this._action = action;
        this._context = context;
    }

    get action(): AccessType {
        return this._action;
    }

    get context() {
        return this._context;
    }

    get accessibility() {
        return this._accessibility;
    }

    when(accessibility: ClassScopeCheckerType | FunctionScopeCheckerType) {
        this._accessibility = accessibility;
    }
}
export class AccessClassDefinition extends AccessDefinition {

    _action: AccessClassType;
    _accessibility: ClassScopeCheckerType = async (query: ConstraintMap) => query;

    constructor(action: AccessClassType, context: typeof Class) {
        super(action, context);
        this._action = action;
        this._context = context;
    }

    when(accessibility: ClassScopeCheckerType) {
        this._accessibility = accessibility;
    }

}

export class AccessFunctionDefinition extends AccessDefinition {

    _action: AccessFunctionType;
    _accessibility: FunctionScopeCheckerType = async () => true;

    constructor(action: AccessFunctionType, context: typeof Function) {
        super(action, context);
        this._action = action;
        this._context = context;
    }

    when(accessibility: FunctionScopeCheckerType) {
        this._accessibility = accessibility;
    }

}

export default class Scope {

    static _access: AccessMapType;

    static get scopeName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Classes extended from `Scope` must define a static getter for scopeName');
    }

    static get description(): string {
        return `Scope for '${this.scopeName}'`;
    }

    static get access(): Array<any> {
        return [];
    }

    static canFind(context: typeof Class): AccessClassDefinition {
        return new AccessClassDefinition(AccessFind, context);
    }

    static canGet(context: typeof Class): AccessClassDefinition {
        return new AccessClassDefinition(AccessGet, context);
    }

    static canCreate(context: typeof Class): AccessClassDefinition {
        return new AccessClassDefinition(AccessCreate, context);
    }

    static canUpdate(context: typeof Class): AccessClassDefinition {
        return new AccessClassDefinition(AccessUpdate, context);
    }

    static canDestroy(context: typeof Class): AccessClassDefinition {
        return new AccessClassDefinition(AccessDestroy, context);
    }

    static canManage(context: typeof Class): Array<AccessClassDefinition> {
        return [
            this.canFind(context),
            this.canGet(context),
            this.canCreate(context),
            this.canUpdate(context),
            this.canDestroy(context)
        ];
    }

    static canRun(context: typeof Function): AccessFunctionDefinition {
        return new AccessFunctionDefinition(AccessRun, context);
    }

    static initialize<T extends typeof Scope>(): T {
        // Access map
        const accessMapDefault: AccessMapType = { classes: {}, functions: {} };

        // Get access list
        const accessList: Array<AccessDefinition> = this.access.reduce((list, access) => {
            if(access instanceof Array) list = [...list, ...access];
            else list.push(access);
        }, []);

        // Map access
        this._access = accessList.reduce((map, { action, context, accessibility }) => {
            // Get context class
            const contextClass = context;
            const contextInstance = new contextClass;

            // Check access type
            if(contextInstance instanceof Class) {
                const className = contextInstance.statics().className;
                const classAccess = { ...map.classes[className], [action]: accessibility };
                map.classes[className] = classAccess;
            }
            else if(contextInstance instanceof Function) {
                const functionName = contextInstance.statics().functionName;
                const functionAccess = { ...map.functions[functionName], [action]: accessibility };
                map.functions[functionName] = functionAccess;
            }

            // Return the map
            return map;
        }, accessMapDefault);

        return this as T;
    }

}