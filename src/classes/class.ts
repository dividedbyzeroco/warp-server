import 'reflect-metadata';
import { KeyManager } from './keys/key';
import Error from '../utils/error';
import KeyMap from '../utils/key-map';
import { toCamelCase, toISODate } from '../utils/format'; 
import { InternalKeys } from '../utils/constants';
import { ClassOptionsType } from '../types/class';
import Pointer, { PointerDefinition } from './pointer';
import CompoundKey from '../utils/compound-key';
import DataMapper from './data-mapper';
import User from './auth/user';

export const MetadataSymbol = 'METADATA';

export interface ClassMetadata {
    keys: {[name: string]: KeyManager};
    joins: {[name: string]: PointerDefinition<typeof Class>};
    hidden: {[name: string]: string};
    protected: {[name: string]: string};
    timestamps: {[name: string]: boolean}
}

export default class Class {

    static _supportLegacy: boolean = false;
    _isNew: boolean = true;
    _id: number;
    _keyMap: KeyMap = new KeyMap;
    _isPointer: boolean = false;

    /**
     * Constructor
     * @param {Object} params 
     * @param {Number} id 
     */
    constructor({ keys = {}, keyMap, id, createdAt, updatedAt, isPointer = false }: ClassOptionsType = {}) {

        // Iterate through each param
        for(let key in keys) {
            // Get value
            let value = keys[key];

            // Set value
            this[toCamelCase(key)] = value;
        }

        // If key map exists, override the existing key map
        if(typeof keyMap !== 'undefined') this._keyMap = keyMap;

        // If id exists, save it and toggle off the isNew flag
        if(typeof id !== 'undefined') {
            this._id = id;
            this._isNew = false;
        }

        // If timestamps exist, save them
        if(typeof createdAt !== 'undefined') this._keyMap.set(InternalKeys.Timestamps.CreatedAt, createdAt);
        if(typeof updatedAt !== 'undefined') this._keyMap.set(InternalKeys.Timestamps.UpdatedAt, updatedAt);

        // Check if class is a pointer
        this._isPointer = isPointer;
    }

    /**
     * Class definition decorator
     * @description Defines and initializes the class
     * @param {String} className 
     * @param {String} source
     */
    static of(className: string, source?: string) {
        return <T extends { new(...args: any[]): Class }>(constructor: T) => {
            class definedClass extends constructor {
                static get className() {
                    return className;
                }

                static get source() {
                    return source || this.className;
                }
            };

            return definedClass;
        };
    }

    static fromId(id: number) {
        return new this({ id });
    }

    static get className(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Classes extended from `Class` must define a static getter for className');
    }

    static get source(): string {
        return this.className;
    }

    static get supportLegacy(): boolean {
        return this._supportLegacy;
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
        else if(this.prototype.getMetadata().timestamps[key]) return true;
        else if(typeof this.prototype.getMetadata().keys[key] === 'undefined') return false;
        else return true;
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

            if((typeof pointerMetadata.keys[pointerKey] === 'undefined'
                    && !pointerMetadata.timestamps[pointerKey]
                    && InternalKeys.Id !== pointerKey)
                || typeof pointerMetadata.hidden[pointerKey] !== 'undefined') {
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
    getMetadata() {
        // const metadata = Reflect.getMetadata(MetadataSymbol, this.constructor.prototype) as ClassMetadata;

        return  {
            keys: {},
            joins: {},
            hidden: {},
            protected: {},
            timestamps: {
                [InternalKeys.Timestamps.CreatedAt]: true,
                [InternalKeys.Timestamps.UpdatedAt]: true,
                [InternalKeys.Timestamps.DeletedAt]: true
            },
            // ...metadata
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
        return this._isNew;
    }

    get id(): number {
        return this._id;
    }

    get createdAt(): string {
        const dateTime = this._keyMap.get(InternalKeys.Timestamps.CreatedAt);
        if(typeof dateTime === 'undefined' || dateTime === null) return dateTime;
        else return toISODate(dateTime);
    }

    get updatedAt(): string {
        const dateTime = this._keyMap.get(InternalKeys.Timestamps.UpdatedAt);
        if(typeof dateTime === 'undefined' || dateTime === null) return dateTime;
        else return toISODate(dateTime);
    }

    get deletedAt(): string {
        const dateTime = this._keyMap.get(InternalKeys.Timestamps.DeletedAt);
        if(typeof dateTime === 'undefined' || dateTime === null) return dateTime;
        else return toISODate(dateTime);
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


        // If class is a pointer, use attributes
        if(this._isPointer) {
            keys = { 
                type: 'Pointer',
                [this.statics().supportLegacy? InternalKeys.Pointers.LegacyClassName
                    : InternalKeys.Pointers.ClassName]: this.statics().className,
                [InternalKeys.Pointers.Attributes]: Object.keys(keys).length > 0 ? keys : undefined
            };
        }
        else {
            // Iterate through each key in key map
            for(let key of Object.keys(this.getMetadata().keys)) {
                // If the key is a timestamp, skip it
                if(InternalKeys.Timestamps.CreatedAt === key 
                    || InternalKeys.Timestamps.UpdatedAt === key
                    || InternalKeys.Timestamps.DeletedAt === key)
                    continue;

                // If the key is hidden, skip it
                if(this.getMetadata().hidden[key])
                    continue;

                // Assign key
                keys[key] = this[toCamelCase(key)];
            }
        }

        // Return the object
        return {
            [InternalKeys.Id]: id,
            ...keys,
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