import 'reflect-metadata';
import Error from '../utils/error';
import KeyMap from '../utils/key-map';
import { toCamelCase, toSnakeCase } from '../utils/format'; 
import { InternalKeys } from '../utils/constants';
import Pointer, { PointerDefinition } from './pointer';
import CompoundKey from '../utils/compound-key';
import DataMapper from './data-mapper';
import User from './auth/user';
import DateKey from './keys/types/date';

export const MetadataSymbol = Symbol.for('METADATA');

export interface ClassMetadata {
    keys: string[];
    joins: { [name: string]: PointerDefinition<typeof Class> };
    hidden: string[];
    protected: string[];
    timestamps: string[];
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
    constructor(keys: { [key: string]: any } = {}) {
        // Iterate through each param
        for(let key in keys) {
            // Get value
            let value = keys[key];

            // Check if key exists
            if(!this.statics().has(key))
                throw new Error(Error.Code.ForbiddenOperation, `Key \`${key}\` does not exist in '${this.statics().className}'`);

            // Set value
            this[toCamelCase(key)] = value;
        }
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

    static fromId(id: number) {
        const instance = new this;
        instance._id = id;
        return instance;
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
            this.hasPointer(key);
            return true;
        }
        else if(key === InternalKeys.Id) return true;
        else if(this.prototype.getMetadata().timestamps.includes(key)) return true;
        else if(this.prototype.getMetadata().keys.includes(key)) return true;
        else return false;
    }

    static hasPointer(key: string) {
        // Check if key parts are valid
        if(!Pointer.isValid(key))
            throw new Error(Error.Code.ForbiddenOperation, `The pointer key \`${key}\` is invalid`);

        // Get alias and key
        const alias = Pointer.getAliasFrom(key);
        const pointerKey = Pointer.getKeyFrom(key);

        // Get class pointer
        const metadata = this.prototype.getMetadata();
        const pointerDefinition = metadata.joins[alias];

        // Check if pointer exists
        if(!(pointerDefinition instanceof PointerDefinition)) {
            throw new Error(Error.Code.MissingConfiguration, `The pointer for \`${key}\` does not exist`);
        }
        else {
            // Get pointer
            const pointer = pointerDefinition.toPointer();
            const pointerMetadata = pointer.class.prototype.getMetadata();

            if((!pointerMetadata.keys.includes(pointerKey)
                    && !pointerMetadata.timestamps.includes(pointerKey)
                    && InternalKeys.Id !== pointerKey)
                    || pointerMetadata.hidden.includes(pointerKey)) {
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
            const join = this.prototype.getMetadata().joins[alias].toPointer();

            // Check if join exists
            if(alias !== this.className && key === join.pointerIdKey) {
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
     * Get class metadata
     */
    getMetadata(): ClassMetadata {
        // Get metadata
        const metadata = Reflect.getMetadata(MetadataSymbol, this) as ClassMetadata;

        // Override default metadata
        return  {
            keys: [],
            joins: {},
            hidden: [],
            protected: [],
            timestamps: Object.values(InternalKeys.Timestamps),
            ...metadata
        };
    }

    /**
     * Set class metadata
     * @param metadata
     */
    setMetadata(metadata: {[name: string]: any}) {
        const classMetadata = this.getMetadata();
        Reflect.defineMetadata(MetadataSymbol, { ...classMetadata, ...metadata }, this);
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

    get createdAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.CreatedAt);
        const getter = keyManager.getter.bind(this);
        return getter();
    }

    get updatedAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.UpdatedAt);
        const getter = keyManager.getter.bind(this);
        return getter();
    }

    get deletedAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.CreatedAt);
        const getter = keyManager.getter.bind(this);
        return getter();
    }

    set id(value: number) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `id` key');
    }

    set createdAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `createdAt` key');
    }

    set updatedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `updatedAt` key');
    }

    set deletedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `deletedAt` key');
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
    toJSON(): object {
        // Get keys
        const { id, createdAt, updatedAt, deletedAt } = this;
        let keys = {};
        let body = {};

        // Iterate through each key in key map
        for(let key of this.getMetadata().keys) {
            // If the key is a timestamp, skip it
            if(this.getMetadata().timestamps.includes(key))
                continue;

            // If the key is hidden, skip it
            if(this.getMetadata().hidden.includes(key))
                continue;

            // Assign key
            keys[key] = this[toCamelCase(key)];
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
            [InternalKeys.Timestamps.UpdatedAt]: updatedAt,
            [InternalKeys.Timestamps.DeletedAt]: deletedAt
        };
    }

    async beforeFind() {
        return;
    }

    async beforeSave<T extends User | undefined>(classes: DataMapper, user: T) {
        return;
    }

    async afterSave<T extends User | undefined>(classes: DataMapper, user: T) {
        return;
    }

    async beforeDestroy<T extends User | undefined>(classes: DataMapper, user: T) {
        return;
    }

    async afterDestroy<T extends User | undefined>(classes: DataMapper, user: T) {
        return;
    }
}