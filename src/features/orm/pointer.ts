import Class from './class';
import { InternalKeys } from '../../utils/constants';
import Error from '../../utils/error';
import { toSnakeCase } from '../../utils/format';
import PointerKey from './keys/types/pointer';
import { ClassCaller } from '../../types/pointer';

export default class Pointer {

    private classType: typeof Class;
    private aliasKeyName: string;
    private viaKeyName: string;
    private idKeyName: string = InternalKeys.Id;
    private isSecondaryFlag: boolean = false;
    private parentAliasKeyName: string;
    private parentViaKeyName: string;

    /**
     * Constructor
     * @param {Class} classType 
     * @param {String} key 
     */
    constructor(classType: typeof Class, key: string) {
        this.classType = classType;
        this.aliasKeyName = key;
        this.viaKeyName = `${this.aliasKeyName}_${InternalKeys.Id}`;
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

    static getIdKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.IdDelimiter);

        // Return the first key part
        return keyParts[0];
    }

    static getPointerKeyFrom(key: string) {
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

    get statics() {
        return this.constructor as typeof Pointer;
    }

    get class(): typeof Class {
        return this.classType;
    }

    get aliasKey(): string {
        return this.aliasKeyName;
    }

    get viaKey(): string {
        return this.viaKeyName;
    }

    get idKey(): string {
        return `${this.aliasKey}${this.statics.Delimiter}${this.idKeyName}`;
    }

    get isSecondary(): boolean {
        return this.isSecondaryFlag;
    }

    get parentAliasKey(): string {
        return this.parentAliasKeyName;
    }

    get parentViaKey(): string {
        return this.parentViaKeyName;
    }

    /**
     * The key inside the current class that has the foreign key
     * @param key
     */
    via(key: string): this {
        this.viaKeyName = key;
        return this;
    }

    /**
     * The key inside the other class that the foreign key matches
     * @param key
     */
    to(key: string): this {
        this.idKeyName = key;
        return this;
    }

    /**
     * The key inside the other class that the secondary pointer matches
     * @param key
     */
    from(key: string): this {
        // Check if key is for a pointer
        if(!this.statics.isUsedBy(key))
            throw new Error(Error.Code.ForbiddenOperation, `Secondary key \`key\` must be a pointer to an existing key`);

        // TODO: Allow parentViaKeys that do not have '_id'
        // Set new via key and set isSecondary to true
        this.parentAliasKeyName = this.statics.getAliasFrom(key);
        this.parentViaKeyName = this.statics.getPointerKeyFrom(key); 
        this.via(`${this.parentAliasKey}${this.statics.Delimiter}${this.parentViaKey}_${InternalKeys.Id}`);
        this.isSecondaryFlag = true;
        
        return this;
    }

    isImplementedBy(value: object) {
        if(value === null) return true;
        if(typeof value !== 'object') return false;
        if(value[InternalKeys.Pointers.Type] !== 'Pointer') return false;
        if(value[InternalKeys.Pointers.ClassName] !== this.class.className) return false;
        if(value[InternalKeys.Id] <= 0) return false;
        return true;
    }
}

export class PointerDefinition<C extends typeof Class> {

    private classCaller: ClassCaller<C>;
    private keyName: string;
    private via?: string;

    constructor(classDefinition: ClassCaller<C>, keyName: string, via?: string) {
        this.classCaller = classDefinition;
        this.keyName = keyName;
        this.via = via;
    }

    toPointer() {
        const pointer = new Pointer(this.classCaller(), this.keyName);
        // If via key is provided
        if(typeof this.via === 'string') {
            // And it is a pointer
            if(Pointer.isUsedBy(this.via)) {
                // Use it as a secondary pointer
                return pointer.from(this.via);
            }
            // Use it as a regular pointer
            else pointer.via(this.via);
        }
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
        const sourceName = via && !Pointer.isUsedBy(via) && via || keyName;

        // Prepare pointer definition
        const pointerDefinition = new PointerDefinition(classDefinition, keyName, via);

        // Prepare key manager
        const keyManager = PointerKey(sourceName, pointerDefinition);

        // Set definition
        const definition = classInstance.getDefinition();
        if(!definition.keys.includes(keyName)) definition.keys.push(keyName);
        definition.joins[keyName] = pointerDefinition;
        classInstance.setDefinition(definition);

        // Override pointer getter and setter
        return {
            set(value) {
                value = keyManager.setter(value);
                this._keys.set(keyManager.name, value);
            },
            get() {
                return keyManager.getter(this._keys.get(keyManager.name));
            },
            enumerable: true,
            configurable: true
        };
    };
};