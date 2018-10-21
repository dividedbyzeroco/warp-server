import 'reflect-metadata';
import { InternalKeys } from '../utils/constants';
import { PointerObjectType } from '../types/class';
import Class from './class';
import Error from '../utils/error';
import { toSnakeCase } from '../utils/format';
import PointerKey from './keys/types/pointer';
import { ClassCaller } from '../types/pointer';

export default class Pointer {

    _class: typeof Class;
    _aliasKey: string;
    _viaKey: string;
    _pointerIdKey: string = InternalKeys.Id;
    _isSecondary: boolean = false;
    _parentAliasKey: string;
    _parentViaKey: string;

    /**
     * Constructor
     * @param {Class} classType 
     * @param {String} key 
     */
    constructor(classType: typeof Class, key: string) {
        this._class = classType;
        this._aliasKey = key;
        this._viaKey = `${this._aliasKey}_${InternalKeys.Id}`;
    }
    
    static get Delimiter(): string {
        return '.';
    }

    static get IdDelimiter(): string {
        return ':';
    }

    static isUsedBy(key: string) {
        return key.indexOf(this.Delimiter) > 0;
    }

    static isUsedAsIdBy(key: string) {
        return key.indexOf(this.IdDelimiter) > 0;
    }

    static isValid(key: string) {
        return this.isUsedBy(key) && key.split(this.Delimiter).length === 2;
    }

    static getAliasFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.Delimiter);

        // Return the first key part
        return keyParts[0];
    }

    static getPointerIdKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.IdDelimiter);

        // Return the first key part
        return keyParts[0];
    }

    static getKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.Delimiter);

        // Return the first key part
        return keyParts[1];
    }

    static getViaKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.IdDelimiter);

        // Return the first key part
        return keyParts[1];
    }

    static get Pointer(): typeof Pointer {
        return Pointer;
    }

    get statics() {
        return this.constructor as typeof Pointer;
    }

    get class(): typeof Class {
        return this._class;
    }

    get aliasKey(): string {
        return this._aliasKey;
    }

    get viaKey(): string {
        return this._viaKey;
    }

    get pointerIdKey(): string {
        return `${this.aliasKey}${this.statics.Delimiter}${this._pointerIdKey}`;
    }

    get isSecondary(): boolean {
        return this._isSecondary;
    }

    get parentAliasKey(): string {
        return this._parentAliasKey;
    }

    get parentViaKey(): string {
        return this._parentViaKey;
    }

    via(key: string): this {
        this._viaKey = key;
        return this;
    }

    to(key: string): this {
        this._pointerIdKey = key;
        return this;
    }

    from(key: string): this {
        // Check if key is for a pointer
        if(!this.statics.isUsedBy(key))
            throw new Error(Error.Code.ForbiddenOperation, `Secondary key \`key\` must be a pointer to an existing key`);

        // Set new via key and set isSecondary to true
        this._parentAliasKey = this.statics.getAliasFrom(key);
        this._parentViaKey = this.statics.getKeyFrom(key); 
        this.via(`${this.parentAliasKey}${this.statics.Delimiter}${this.parentViaKey}_${InternalKeys.Id}`);
        this._isSecondary = true;
        
        return this;
    }

    isImplementedBy(value: object) {
        if(value === null) return true;
        if(typeof value !== 'object') return false;
        if(value['type'] !== 'Pointer') return false;
        if(value[InternalKeys.Pointers.ClassName] !== this.class.className) return false;
        if(value[InternalKeys.Id] <= 0) return false;
        return true;
    }

    toObject(value?: number | object): PointerObjectType | null {
        // Check if value exists
        if(!value) return null;

        // Get class type
        const classType = this.class;

        // If value is a number
        if(typeof value === 'number') {
            // Create class instance
            const id = value;
            const classInstance = new classType;
            classInstance._id = id;

            // Otherwise, return a pointer object
            return classInstance.toJSON() as PointerObjectType;
        }
        else if(typeof value === 'object') {    
            // Get key values
            const id = value[InternalKeys.Id];
            const createdAt = value[InternalKeys.Timestamps.CreatedAt];
            const updatedAt = value[InternalKeys.Timestamps.UpdatedAt];
            const attributes = value[InternalKeys.Pointers.Attributes];

            // Create class instance
            const classInstance = new classType;
            classInstance._id = id;
            classInstance._keys = attributes;
            classInstance._keys.set(InternalKeys.Timestamps.CreatedAt, createdAt);
            classInstance._keys.set(InternalKeys.Timestamps.UpdatedAt, updatedAt);
            classInstance._isPointer = true;

            // Return a pointer object
            return classInstance.toJSON() as PointerObjectType;
        }
        else return null;
    }
}

export class PointerDefinition<C extends typeof Class> {

    _classCaller: ClassCaller<C>;
    _keyName: string;
    _via?: string;

    constructor(classDefinition: ClassCaller<C>, keyName: string, via?: string) {
        this._classCaller = classDefinition;
        this._keyName = keyName;
        this._via = via;
    }

    toPointer() {
        const pointer = this._classCaller().as(this._keyName);
        if(typeof this._via === 'string') pointer.via(this._via);
        return pointer;
    }
}

/**
 * BelongsTo decorator for pointers
 * @param classDefinition 
 */
export const BelongsTo = <C extends typeof Class>(classDefinition: ClassCaller<C>, via?: string) => {
    return <T extends Class>(classInstance: T, name: string): any => {
        // Get pointer name
        const keyName = toSnakeCase(name);

        // Prepare pointer definition
        const pointerDefinition = new PointerDefinition(classDefinition, keyName, via);

        // Prepare key manager
        const keyManager = PointerKey(name, pointerDefinition);

        // Set metadata
        const metadata = classInstance.getMetadata();
        metadata.joins[keyName] = pointerDefinition;
        classInstance.setMetadata(metadata);

        // Override pointer getter and setter
        return {
            set(value) {
                value = keyManager.setter(value);
                this._keyMap.set(keyManager.name, value);
            },
            get() {
                return keyManager.getter(this._keyMap.get(keyManager.name));
            },
            enumerable: true,
            configurable: true
        };
    };
};