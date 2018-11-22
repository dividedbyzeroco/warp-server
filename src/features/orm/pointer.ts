import Class, { ClassDefinitionManager } from './class';
import { InternalKeys, PointerDelimiter } from '../../utils/constants';
import { toSnakeCase } from '../../utils/format';
import Error from '../../utils/error';
import PointerKey from './keys/types/pointer';
import { ClassCaller } from '../../types/pointer';
import { Query } from '../..';

export default class Pointer {

    public sourceClassName: string;
    public sourceKey: string;
    public classType: typeof Class;
    public parentClassName: string;
    public parentKey: string;
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
        secondary: boolean = false,
    ) {
        this.classType = classType;
        this.sourceClassName = sourceClassName;
        this.sourceKey = sourceKey;
        this.parentClassName = parentClassName;
        this.parentKey = parentKey;
        this.secondaryFlag = secondary;
    }

    public static isUsedBy(key: string) {
        return key.indexOf(PointerDelimiter) > 0;
    }

    public static isValid(key: string) {
        return this.isUsedBy(key) && key.split(PointerDelimiter).length === 2;
    }

    public static parseKey(keyName: string): [string, string] {
        // Get key parts
        const [ className, key ] = keyName.split(PointerDelimiter, 2);

        return [ className, key ];
    }

    public static formatKey(className: string, key: string) {
        return `${className}${PointerDelimiter}${key}`;
    }

    public static formatAsId(key: string) {
        return `${key}_${InternalKeys.Id}`;
    }

    public statics() {
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
    public sourceClassKey(className: string): string {
        const sourceClass = this.sourceClassName !== PointerDefinition.OwnerSymbol ? this.sourceClassName : className;
        return this.statics().formatKey(sourceClass, this.sourceKey);
    }

    /**
     * The key inside the other class that the foreign key matches
     */
    public parentClassKey(): string {
        return this.statics().formatKey(this.parentClassName, this.parentKey);
    }

    public isImplementedBy(value: object) {
        if (value === null) return true;
        if (typeof value !== 'object') return false;
        if (value[InternalKeys.Pointers.Type] !== 'Pointer') return false;
        if (value[InternalKeys.Pointers.ClassName] !== this.class.className) return false;
        if (value[InternalKeys.Id] === null || typeof value[InternalKeys.Id] === 'undefined') return false;
        return true;
    }
}

export class PointerDefinition<C extends typeof Class> {

    private classCaller: ClassCaller<C>;
    private sourceClassName: string;
    private sourceKey: string;
    private parentClassName: string;
    private parentKey: string;

    public static OwnerSymbol = '*';

    constructor(
        classDefinition: ClassCaller<C>,
        sourceClassName: string,
        sourceKey: string,
        parentClassName: string,
        parentKey: string,
    ) {
        this.classCaller = classDefinition;
        this.sourceClassName = sourceClassName;
        this.sourceKey = sourceKey;
        this.parentClassName = parentClassName;
        this.parentKey = parentKey;
    }

    public toPointer() {
        const classType = this.classCaller();
        const definition = ClassDefinitionManager.get(classType);
        const { sourceClassName, sourceKey, parentClassName, parentKey } = this;
        let actualSourceKey = sourceKey;
        let secondary = false;

        // Check if source is the owner
        if (sourceClassName !== PointerDefinition.OwnerSymbol) secondary = true;

        // Check if pointer is secondary
        if (secondary) {
            if (typeof definition.relations[sourceKey] !== 'undefined') {
                // Get parent definition
                const parentDefinition = definition.relations[sourceKey];
                actualSourceKey = parentDefinition.toPointer().sourceKey;
            } else throw new Error(Error.Code.ForbiddenOperation, `Pointer \`${this.sourceKey}\` does not exist in ${sourceClassName}`);
        }

        // Create a pointer
        const pointer = new Pointer(
            classType,
            sourceClassName,
            actualSourceKey,
            parentClassName,
            parentKey,
            secondary,
        );

        // Return pointer
        return pointer;
    }
}

/**
 * belongsTo decorator for pointers
 * @param classCaller
 */
export const belongsTo = <C extends typeof Class>(classCaller: ClassCaller<C>, from?: string, to?: string) => {
    return <T extends Class>(classInstance: T, name: string): any => {
        // Get pointer name
        const keyName = toSnakeCase(name);

        // Set default values
        from = from || Pointer.formatKey(PointerDefinition.OwnerSymbol, Pointer.formatAsId(keyName));
        to = to || Pointer.formatKey(keyName, InternalKeys.Id);

        // Extract keys
        const [ sourceClassName, sourceKey ] = Pointer.parseKey(from);
        const [ parentClassName, parentKey ] = Pointer.parseKey(to);

        // Prepare pointer definition
        const pointerDefinition = new PointerDefinition(classCaller, sourceClassName, sourceKey, parentClassName, parentKey);

        // Prepare key manager
        const keyManager = PointerKey(keyName, pointerDefinition);

        // Set definition
        const definition = ClassDefinitionManager.get(classInstance.statics());
        if (!definition.keys.includes(keyName)) definition.keys.push(keyName);
        definition.relations[keyName] = pointerDefinition;
        ClassDefinitionManager.set(classInstance.statics(), definition);

        // Override pointer getter and setter
        Object.defineProperty(classInstance, name, {
            set(value) {
                value = keyManager.setter(value);
                this.keys.set(keyManager.name, value);
            },
            get() {
                return keyManager.getter(this.keys.get(keyManager.name));
            },
            enumerable: true,
            configurable: true,
        });
    };
};

/**
 * hasMany decorator for relations
 * @param classCaller 
 * @param key 
 */
export const hasMany = <C extends typeof Class>(classCaller: ClassCaller<C>, key?: string) => {
    return <T extends Class>(classInstance: T, name: string): any => {
        // Override pointer getter and setter
        Object.defineProperty(classInstance, name, {
            set(value) {
                throw new Error(Error.Code.ForbiddenOperation, 'Cannot set the value of a `hasMany` relation');
            },
            get() {
                if(this.isNew) throw new Error(Error.Code.ForbiddenOperation, 'Cannot get a `hasMany` relation for a new object');
                const pointerKey: string = Pointer.formatKey(this.statics().className, InternalKeys.Id);
                key = key || pointerKey;
                return new Query(classCaller()).equalTo(key, this.id);
            },
            enumerable: true,
            configurable: true,
        });
    };
};