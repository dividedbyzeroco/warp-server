import { KeyManager } from './keys/key';
import Error from '../utils/error';
import KeyMap from '../utils/key-map';
import { toCamelCase, toISODate } from '../utils/format'; 
import { InternalKeys } from '../utils/constants';
import { getPropertyDescriptor } from '../utils/props';
import { ClassOptionsType } from '../types/class';
import Pointer from './pointer';
import CompoundKey from '../utils/compound-key';

export default class Class {

    static _supportLegacy: boolean = false;
    static _keys: {[name: string]: any};
    static _joins: {[name: string]: Pointer};
    static _hidden: {[name: string]: string};
    static _protected: {[name: string]: string};
    static _timestamps: {[name: string]: boolean};
    _isNew: boolean = true;
    _id: number;
    _keyMap: KeyMap = new KeyMap;
    _isPointer: boolean;

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

            // Check if setter exists
            const keyDescriptor = getPropertyDescriptor(this, toCamelCase(key));
            if(typeof keyDescriptor !== 'undefined' && typeof keyDescriptor.set === 'function') {
                try {
                    const setter = keyDescriptor.set.bind(this);
                    setter(value);
                }
                catch(err) {
                    throw new Error(Error.Code.InvalidObjectKey, err.message);
                }
            }
            // Otherwise, generically set the value
            else this.set(key, value);
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

            definedClass['initialize']();
            return definedClass;
        };
    }


    /**
     * Initialize
     * @description Function that must be invoked once
     * in order to initialize the class
     * @param {boolean} supportLegacy
     * @returns {WarpServer}
     */
    static initialize(supportLegacy: boolean = false) {
        // Set legacy support
        this._supportLegacy = supportLegacy;

        // Prepare joins
        this._joins = {};

        // Prepare key definitions
        this._keys = this.keys.reduce((map, key) => {
            // Check if key is a string
            if(typeof key === 'string') {
                // Check if key is in valid snake_case format
                if(!(/^[a-z]+(_[a-z]+)*$/).test(key)) {
                    throw new Error(Error.Code.ForbiddenOperation, 
                        `Keys defined in classes must be in snake_case format: ${this.className}.${key}`);
                }

                // Set the key
                map[key] = key;
            }
            // Else, if it is a pointer
            else if(key instanceof Pointer) {
                // Use the alias key
                map[key.aliasKey] = key;

                // If it is a secondary key, check if parent and via keys exist
                if(key.isSecondary) {
                    const parentJoin = this._joins[key.parentAliasKey];
                    if(typeof parentJoin === 'undefined')
                        throw new Error(Error.Code.MissingConfiguration, 
                            `Parent pointer \`${key.parentAliasKey}\` of \`${key.aliasKey}\` does not exist`);

                    if(!parentJoin.class.has(key.parentViaKey))
                        throw new Error(Error.Code.MissingConfiguration, 
                            `Parent pointer key \`${key.parentAliasKey}${Pointer.Delimiter}${key.parentViaKey}\` of \`${key.aliasKey}\` does not exist`);
                }

                // Add the pointer to joins
                this._joins[key.aliasKey] = key;

                // Override pointer getter and setter
                const pointerDescriptor = Object.getOwnPropertyDescriptor(this.prototype, toCamelCase(key.aliasKey));

                // If pointer descriptor doesn't exist
                if(typeof pointerDescriptor === 'undefined') {
                    Object.defineProperty(this.prototype, toCamelCase(key.aliasKey), {
                        set(value) {
                            if(key.isSecondary)
                                throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set secondary pointers`);
                            if(!key.isImplementedBy(value))
                                throw new Error(Error.Code.ForbiddenOperation, 
                                    `Key \`${key.aliasKey}\` must be a pointer to \`${key.class.className}\``);

                            // Set the via key value and alias
                            this._keyMap.set(key.viaKey, value? value.id : null);
                            this._keyMap.setAlias(key.viaKey, key.aliasKey);
                        },
                        get() {
                            // Retrieve the via key value
                            const value = this._keyMap.get(key.viaKey);

                            // If value is null, return null
                            if(value === null) return null;
                            if(typeof value === 'object' && value.id === null) return null;

                            // Get the pointer key object
                            return key.toObject(value);
                        }
                    });
                }
            }
            // Else, if it is a key manager
            else if(key instanceof KeyManager) {
                // Use the name of the key
                map[key.name] = key.name;

                // Override pointer getter and setter
                const keyDescriptor = Object.getOwnPropertyDescriptor(this.prototype, toCamelCase(key.name));

                // If key descriptor doesn't exist
                if(typeof keyDescriptor === 'undefined') { 
                    Object.defineProperty(this.prototype, toCamelCase(key.name), {
                        set(value) {
                            value = key.setter(value);
                            this._keyMap.set(key.name, value);
                        },
                        get() {
                            return key.getter(this._keyMap.get(key.name));
                        }
                    });
                }
            }
            else {
                throw new Error(Error.Code.MissingConfiguration, `Key \`${key}\` must either be a string, a Pointer or a Key`);
            }
            
            // Return the map
            return map;
        }, {});

        // Prepare hidden keys
        this._hidden = this.hidden.reduce((map, key) => {
            // Check if the key exists
            if(typeof this._keys[key] === 'undefined')
                throw new Error(Error.Code.MissingConfiguration, `Hidden key \`${this.className}.${key}\` does not exist in keys`);

            // Set the key
            map[key] = key;
            return map;
        }, {});

        // Prepare protected keys
        this._protected = this.protected.reduce((map, key) => {
            // Check if the key exists
            if(typeof this._keys[key] === 'undefined')
                throw new Error(Error.Code.MissingConfiguration, `Protected key \`${this.className}.${key}\` does not exist in keys`);

            // Set the key
            map[key] = key;
            return map;
        }, {});

        // Prepare timestamp keys
        this._timestamps = {
            [InternalKeys.Timestamps.CreatedAt]: true,
            [InternalKeys.Timestamps.UpdatedAt]: true,
            [InternalKeys.Timestamps.DeletedAt]: true
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

    static get keys(): Array<any> {
        return [];
    }

    static get hidden(): Array<string> {
        return [];
    }

    static get protected(): Array<string> {
        return [];
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
        else if(this._timestamps[key]) return true;
        else if(typeof this._keys[key] === 'undefined') return false;
        else return true;
    }

    static hasPointer(key: string) {
        // Check if key parts are valid
        if(Pointer.isValid(key))
            throw new Error(Error.Code.ForbiddenOperation, `The pointer key \`${key}\` is invalid`);

        // Get alias and key
        const alias = Pointer.getAliasFrom(key);
        const pointerKey = Pointer.getKeyFrom(key);

        // Get class pointer
        const pointer = this._keys[alias];

        // Check if pointer exists
        if(!(pointer instanceof Pointer)) {
            throw new Error(Error.Code.MissingConfiguration, `The pointer for \`${key}\` does not exist`);
        }
        else if(
            (typeof pointer.class._keys[pointerKey] !== 'string'
                && !pointer.class._timestamps[pointerKey]
                && InternalKeys.Id !== pointerKey)
            || typeof pointer.class._hidden[pointerKey] === 'string') {
            throw new Error(Error.Code.ForbiddenOperation, `The pointer key for \`${key}\` does not exist or is hidden`);
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
            const join = this._joins[alias];

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
     * Generic setter for all keys
     * @param {String} key 
     * @param {*} value 
     */
    set(key: string, value: any) {
        // Check the key
        if(this.statics()._protected[key]) {
            // If it is a protected key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set \`${key}\` because it is a protected key`);
        }
        else if(InternalKeys.Id === key || this.statics()._timestamps[key]) {
            // If it is an internal key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set \`${key}\` because it is an internal key`);
        }
        else if(this.statics()._keys[key] instanceof Pointer) {
            // If the key is a pointer
            throw new Error(Error.Code.ForbiddenOperation, `Cannot use the generic \`set\` method for pointers (use the pointer setter instead)`);
        }
        else if(typeof this.statics()._keys[key] !== 'undefined') {
            // If the key exists
            this._keyMap.set(key, value);
        }
        else {
            // Otherwise, return an error
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${key}\` does not exist for \`${this.statics().className}\``);
        }
    }

    /**
     * Generic getter for all keys
     * @param {String} key 
     * @param {*} value 
     */
    get(key: string): any {
        // Check the key
        if(this.statics()._hidden[key]) {
            // If it is a hidden key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually get \`${key}\` because it is a hidden key`);
        }
        else if(InternalKeys.Id === key || this.statics()._timestamps[key]) {
            // If it is an internal key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually get \`${key}\` because it is an internal key`);
        }
        else if(this.statics()._keys[key] instanceof Pointer) {
            // If the key is a pointer
            throw new Error(Error.Code.ForbiddenOperation, `Cannot use the generic \`get\` method for pointers (use \`this.${key}\` instead)`);
        }

        // Otherwise, get the KeyMap value
        return this._keyMap.get(key);
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

        // Iterate through each key in key map
        for(let key of this._keyMap.getAliases()) {
            // If the key is a timestamp, skip it
            if(InternalKeys.Timestamps.CreatedAt === key 
                || InternalKeys.Timestamps.UpdatedAt === key
                || InternalKeys.Timestamps.DeletedAt === key)
                continue;

            // If the key is hidden, skip it
            if(this.statics()._hidden[key])
                continue;

            // Get the key descriptor
            const keyDescriptor = getPropertyDescriptor(this, toCamelCase(key));

            // Check if key descriptor exists
            if(typeof keyDescriptor !== 'undefined' && typeof keyDescriptor.get === 'function') {
                const getter = keyDescriptor.get.bind(this);
                keys[key] = getter();
            }
            else
                keys[key] = this.get(key);
        }

        // If class is a pointer, use attributes
        if(this._isPointer) 
            keys = { 
                type: 'Pointer',
                [this.statics().supportLegacy? InternalKeys.Pointers.LegacyClassName
                    : InternalKeys.Pointers.ClassName]: this.statics().className,
                [InternalKeys.Pointers.Attributes]: Object.keys(keys).length > 0 ? keys : undefined
            };

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

    async beforeSave() {
        return;
    }

    async afterSave() {
        return;
    }

    async beforeDestroy() {
        return;
    }

    async afterDestroy() {
        return;
    }
}