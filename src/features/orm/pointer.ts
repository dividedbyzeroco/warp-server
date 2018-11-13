import Class from './class';
import { InternalKeys, PointerDelimiter } from '../../utils/constants';
import { toSnakeCase } from '../../utils/format';
import Error from '../../utils/error';
import PointerKey from './keys/types/pointer';
import { ClassCaller } from '../../types/pointer';

export default class Pointer {

    sourceClassName: string;
    sourceKey: string;
    classType: typeof Class;
    parentClassName: string;
    parentKey: string;
    private secondaryFlag: boolean;

    /**
     * Constructor
     * @param {Class} classType 
     * @param {String} aliasKey 
     */
    constructor(
        classType: typeof Class,
        sourceClassName: string, 
        sourceKey: string,
        parentClassName: string,
        parentKey: string,
        secondary: boolean = false
    ) {
        this.classType = classType;
        this.sourceClassName = sourceClassName;
        this.sourceKey = sourceKey;
        this.parentClassName = parentClassName;
        this.parentKey = parentKey;
        this.secondaryFlag = secondary;
    }

    static isUsedBy(key: string) {
        return key.indexOf(PointerDelimiter) > 0;
    }

    static isValid(key: string) {
        return this.isUsedBy(key) && key.split(PointerDelimiter).length === 2;
    }

    static parseKey(keyName: string): [string, string] {
        // Get key parts
        const [ className, key ] = keyName.split(PointerDelimiter, 2);

        return [ className, key ];
    }

    static formatKey(className: string, key: string) {
        return `${className}${PointerDelimiter}${key}`;
    }

    static formatAsId(key: string) {
        return `${key}_${InternalKeys.Id}`;
    }

    statics() {
        return this.constructor as typeof Pointer;
    }
    
    get class(): typeof Class {
        return this.classType;
    }

    get secondary(): boolean {
        return this.secondaryFlag;
    }

    /**
     * The foreign key inside the current class
     */
    get sourceClassKey(): string {
        return this.statics().formatKey(this.sourceClassName, this.sourceKey);
    }

    /**
     * The key inside the other class that the foreign key matches
     */
    get parentClassKey(): string {
        return this.statics().formatKey(this.parentClassName, this.parentKey);
    }

    isImplementedBy(value: object) {
        if(value === null) return true;
        if(typeof value !== 'object') return false;
        if(value[InternalKeys.Pointers.Type] !== 'Pointer') return false;
        if(value[InternalKeys.Pointers.ClassName] !== this.class.className) return false;
        if(value[InternalKeys.Id] === null || typeof value[InternalKeys.Id] === 'undefined') return false;
        return true;
    }
}

export class PointerDefinition<C extends typeof Class> {

    private classCaller: ClassCaller<C>;
    private sourceClassName: string;
    private sourceKey: string;
    private parentClassName: string;
    private parentKey: string;
    private secondary: boolean;

    constructor(
        classDefinition: ClassCaller<C>, 
        sourceClassName: string, 
        sourceKey: string,
        parentClassName: string,
        parentKey: string,
        secondary: boolean
    ) {
        this.classCaller = classDefinition;
        this.sourceClassName = sourceClassName;
        this.sourceKey = sourceKey;
        this.parentClassName = parentClassName;
        this.parentKey = parentKey;
        this.secondary = secondary;
    }

    toPointer() {
        const classType = this.classCaller();
        const definition = classType.prototype.getDefinition();
        const { sourceClassName, sourceKey, parentClassName, parentKey, secondary } = this;
        let actualSourceKey = sourceKey;
        
        // Check if pointer is secondary
        if(this.secondary) {
            if(typeof definition.relations[sourceKey] !== 'undefined') {
                // Get parent definition
                const parentDefinition = definition.relations[sourceKey];
                actualSourceKey = parentDefinition.toPointer().sourceKey;
            }
            else throw new Error(Error.Code.ForbiddenOperation, `Pointer \`${this.sourceKey}\` does not exist in ${this.sourceClassName}`);
        }

        // Create a pointer
        const pointer = new Pointer(
            classType, 
            sourceClassName,
            actualSourceKey,
            parentClassName,
            parentKey,
            secondary
        );
    
        // Return pointer
        return pointer;
    }
}

/**
 * BelongsTo decorator for pointers
 * @param classCaller 
 */
export const BelongsTo = <C extends typeof Class>(classCaller: ClassCaller<C>, from?: string, to?: string) => {
    return <T extends Class>(classInstance: T, name: string): any => {
        // Get pointer name
        const keyName = toSnakeCase(name);

        // Set default values
        from = from || Pointer.formatKey(classInstance.statics().className, Pointer.formatAsId(keyName));
        to = to || Pointer.formatKey(keyName, InternalKeys.Id);

        // Extract keys
        const [ sourceClassName, sourceKey ] = Pointer.parseKey(from);
        const [ parentClassName, parentKey ] = Pointer.parseKey(to);

        // Check if pointer is secondary
        const secondary = sourceClassName !== classInstance.statics().className;
        
        // Prepare pointer definition
        const pointerDefinition = new PointerDefinition(classCaller, sourceClassName, sourceKey, parentClassName, parentKey, secondary);

        // Prepare key manager
        const keyManager = PointerKey(keyName, pointerDefinition);

        // Set definition
        const definition = classInstance.getDefinition();
        if(!definition.keys.includes(keyName)) definition.keys.push(keyName);
        definition.relations[keyName] = pointerDefinition;

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