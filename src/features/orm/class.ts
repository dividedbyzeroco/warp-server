import Error from '../../utils/error';
import KeyMap from '../../utils/key-map';
import { toCamelCase, toSnakeCase } from '../../utils/format'; 
import { InternalKeys, InternalId } from '../../utils/constants';
import Pointer, { PointerDefinition } from './pointer';
import CompoundKey from '../../utils/compound-key';
import DataMapper from './data-mapper';
import User from '../auth/user';
import { Query } from '../..';
import { ClassKeys, ClassOptions, ClassJSON } from '../../types/class';
import DateKey from './keys/types/date';

export const ClassDefinitionSymbol = Symbol.for('warp-server:class-definition');

export interface ClassDefinition {
    keys: string[];
    timestamps: string[];
    joins: { [name: string]: PointerDefinition<typeof Class> };
    hidden: string[];
}

export default class Class {

    _id: number;
    _keys: KeyMap = new KeyMap;
    _isPointer: boolean = false;

    /**
     * Constructor
     * @param {Object} params 
     * @param {Number} id 
     */
    constructor(keys: number | ClassKeys = {}) {
        // If 'keys' is an id, set the id
        if(typeof keys === 'number') {
            this._id = keys;
        }
        // If 'keys' is an object, set values
        else if(typeof keys === 'object') {
            // Iterate through each param
            for(let [key, value] of Object.entries(keys)) {
                // Check if key exists
                if(!this.statics().has(key))
                    throw new Error(Error.Code.ForbiddenOperation, `Key \`${key}\` does not exist in '${this.statics().className}'`);
    
                // If the key is an id, set the id
                // Else, set the value
                if(key === InternalId)
                    this._id = value;
                else
                    this[toCamelCase(key)] = value;
            }
        }
        else throw new Error(Error.Code.ForbiddenOperation, `'keys' must be an object or an id`);
    }

    private static decorator = (className: string, source?: string) => {
        return <T extends { new(...args: any[]): Class }>(constructor: T) => {
            class DefinedClass extends constructor {
                static get className() {
                    return className;
                }

                static get source() {
                    return source || this.className;
                }
            };

            return DefinedClass;
        };
    }

    /**
     * Iterables
     */
    private get iterables() {
        const { keys, hidden } = this.getDefinition();
        return keys.filter(key => !hidden.includes(key));
    }

    /**
     * Class definition decorator
     * @description Defines and initializes the class
     * @param {String} className 
     * @param {String} source
     */
    static definition<C extends { new(...args: any[]): Class }>(constructor: C): any;
    static definition(className: string, source?: string): any;
    static definition<C extends { new(...args: any[]): Class }>(...args: [string, string?] | [C]) {
        if(args.length === 1) {
            if(typeof args[0] !== 'string') {
                const className = toSnakeCase(args[0].name);
                return Class.decorator(className)(args[0]);
            }
            else {
                return Class.decorator(args[0]);
            }
        }
        else {
            return Class.decorator(args[0], args[1]);
        }
    }

    /**
     * Alias of Class.definition
     * @param className
     * @param source
     */
    static of(className: string, source?: string) {
        return this.definition(className, source);
    }

    static get className(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Classes extended from `Class` must define a static getter for className');
    }

    static get source(): string {
        return this.className;
    }

    /**
     * @description Check if provided key exists for the class
     * @param {String} key
     */
    static has(key: string): boolean {
        // Check if the key is compound
        if(CompoundKey.isUsedBy(key)) {
            return CompoundKey.from(key).every(k => this.has(k));
        }
        // Check if the key is for a pointer
        else if(Pointer.isUsedBy(key)) {
            // Validate pointer key
            this.hasPointerKey(key);
            return true;
        }
        else if(key === InternalKeys.Id) return true;
        else if(this.prototype.getDefinition().keys.includes(key)) return true;
        else return false;
    }

    private hasPointer(key: string) {
        return this.getDefinition().joins[key];
    }

    static hasPointerKey(key: string) {
        // Check if key parts are valid
        if(!Pointer.isValid(key))
            throw new Error(Error.Code.ForbiddenOperation, `The pointer key \`${key}\` is invalid`);

        // Get alias and key
        const alias = Pointer.getAliasFrom(key);
        const pointerKey = Pointer.getPointerKeyFrom(key);

        // Get class pointer
        const definition = this.prototype.getDefinition();
        const pointerDefinition = definition.joins[alias];

        // Check if pointer exists
        if(!(pointerDefinition instanceof PointerDefinition)) {
            throw new Error(Error.Code.MissingConfiguration, `The pointer for \`${key}\` does not exist`);
        }
        else {
            // Get pointer
            const pointer = pointerDefinition.toPointer();
            const pointerClassDefinition = pointer.class.prototype.getDefinition();

            if((!pointerClassDefinition.keys.includes(pointerKey)
                    && InternalKeys.Id !== pointerKey)
                    || pointerClassDefinition.hidden.includes(pointerKey)) {
                throw new Error(Error.Code.ForbiddenOperation, `The pointer key for \`${key}\` does not exist or is hidden`);
            }
        }
    }

    /**
     * Get the constraint key format of the supplied key
     * @param {String} key
     */
    static getConstraintKey(key: string) {
        // Check if the key is for a pointer
        if(Pointer.isUsedBy(key)) {
            // Get alias and join
            const alias = Pointer.getAliasFrom(key);
            const join = this.prototype.getDefinition().joins[alias].toPointer();

            // Check if join exists
            if(alias !== this.className && key === join.idKey) {
                // If pointer is secondary, use the via key
                if(join.isSecondary)
                    return join.viaKey;
                else 
                    // If alias is not the main class and key is a pointer id, add the via key
                    return `${this.className}${Pointer.Delimiter}${join.viaKey}`;
            }
            else return key;
        }
        else return `${this.className}${Pointer.Delimiter}${key}`;
    }
    
    /**
     * @description Create a pointer
     * @param {string} key 
     * @returns {WarpServer.Pointer}
     */
    static as(key: string): Pointer {
        return new Pointer(this, key);
    }

    /**
     * Get class definition
     */
    getDefinition(): ClassDefinition {
        // Get definition
        const definition = Reflect.getMetadata(ClassDefinitionSymbol, this) as ClassDefinition;

        // Override default definition
        return  {
            keys: [],
            timestamps: Object.values(InternalKeys.Timestamps),
            joins: {},
            hidden: [],
            ...definition
        };
    }

    /**
     * Set class definition
     * @param definition
     */
    setDefinition(definition: {[name: string]: any}) {
        const classDefinition = this.getDefinition();
        Reflect.defineMetadata(ClassDefinitionSymbol, { ...classDefinition, ...definition }, this);
    }
    
    statics<T extends typeof Class>(): T {
        return this.constructor as T;
    }

    get isNew(): boolean {
        return typeof this._id !== 'undefined';
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `id` key');
    }

    get createdAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.CreatedAt);
        const getter = keyManager.getter.bind(this);
        return getter();
    }

    set createdAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `createdAt` key');
    }

    get updatedAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.UpdatedAt);
        const getter = keyManager.getter.bind(this);
        return getter();
    }

    set updatedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `updatedAt` key');
    }

    /**
     * toPointer
     * @description Convert the class object into a pointer
     */
    toPointer() {
        // Convert the class object into a pointer
        this._isPointer = true;
    }

    /**
     * toJSON
     * @description Executed every time the object is stringified
     */
    toJSON<C extends this>(): ClassJSON<C> {
        // Get keys
        const { id, createdAt, updatedAt } = this;
        let keys = {};
        let body = {};

        // Iterate through each key in key map
        for(let key of this.iterables) {
            // Get value
            let value = this[key];

            // Check if key is a join
            if(this.hasPointer(key)) value = value.toJSON();

            // Set value
            keys[key] = value;
        }

        // If class is a pointer, use attributes
        if(this._isPointer) {
            body = { 
                type: 'Pointer',
                [InternalKeys.Pointers.ClassName]: this.statics().className,
                [InternalKeys.Pointers.Attributes]: Object.keys(keys).length > 0 ? keys : undefined
            };
        }
        else body = keys; // Else use the keys as-is

        // Return the object
        return {
            [InternalKeys.Id]: id,
            ...body,
            [InternalKeys.Timestamps.CreatedAt]: createdAt,
            [InternalKeys.Timestamps.UpdatedAt]: updatedAt
        };
    }

    increment(key: string, value: number) {
        // Check if key exists
        this.statics().has(key);

        // Set key to an increment value
        this[key] = { type: 'Increment', value };
    }

    beforeFind<Q extends Query<any>, U extends User | undefined>(query: Q, opts: ClassOptions<U>): any {
        return;
    }

    beforeFirst<Q extends Query<any>, U extends User | undefined>(query: Q, opts: ClassOptions<U>): any {
        return;
    }

    beforeGet<Q extends Query<any>, U extends User | undefined>(query: Q, opts: ClassOptions<U>): any {
        return;
    }

    beforeSave<U extends User | undefined>(classes: DataMapper, opts: ClassOptions<U>): any {
        return;
    }

    afterSave<U extends User | undefined>(classes: DataMapper, opts: ClassOptions<U>): any {
        return;
    }

    beforeDestroy<U extends User | undefined>(classes: DataMapper, opts: ClassOptions<U>): any {
        return;
    }

    afterDestroy<U extends User | undefined>(classes: DataMapper, opts: ClassOptions<U>): any {
        return;
    }
}