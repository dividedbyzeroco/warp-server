import { toSnakeCase } from '../../../utils/format';
import { KeyOptions } from '../../../types/key';
import Class, { ClassDefinitionManager } from '../class';
import StringKey from './types/string';
import DateKey from './types/date';
import NumberKey from './types/number';
import JsonKey from './types/json';
import BooleanKey from './types/boolean';
import RelationKey from './types/relation';
import Relation, { RelationDefinition } from '../relation';
import { InternalKeys } from '../../../utils/constants';

/**
 * Key Manager
 * @description Handler for getters and setters
 */
export class KeyManager {

    private keyType: string;
    private keyName: string;
    private isNewFlag: boolean = false;
    public setterDefinition: (value: any) => any = value => value;
    public getterDefinition: (value: any) => any = value => value;

    constructor(name: string, type?: string) {
        this.keyName = name;
        this.keyType = type || 'any';
    }

    get type() {
        return this.keyType;
    }

    set isNew(value: boolean) {
        this.isNewFlag = value;
    }

    get isNew() {
        return this.isNewFlag;
    }

    get name(): string {
        return this.keyName;
    }

    get setter(): (value: any) => any {
        return this.setterDefinition;
    }

    get getter(): (value: any) => any {
        return this.getterDefinition;
    }
}

/**
 * Key Decorator
 * @param opts
 */
export const keyDecorator = (opts: KeyOptions = {}) => {
    return <C extends Class>(classInstance: C, name: string): any => {
        // Get type name
        let { type } = opts;
        let { from, to } = opts;

        // Convert key name to snake case, prepare key manager
        const keyName = toSnakeCase(name);
        const sourceName = from || keyName;
        let keyManager = new KeyManager(keyName);

        // Infer data type
        const inferredType = Reflect.getMetadata('design:type', classInstance, name);

        // Get type from metadata
        if (typeof inferredType !== 'undefined') type = inferredType.name.toLowerCase();

        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());
        if (!definition.keys.includes(keyName) && !definition.timestamps.includes(keyName)) {
            definition.keys.push(keyName);
        }

        // Determine key manager
        if (type === 'string') keyManager = StringKey(sourceName);
        else if (type === 'date') keyManager = DateKey(sourceName);
        else if (type === 'boolean') keyManager = BooleanKey(sourceName);
        else if (type === 'number') keyManager = NumberKey(sourceName);
        else if (type === 'array') keyManager = JsonKey(sourceName);
        else if (type === 'object') keyManager = JsonKey(sourceName);
        else if (type === 'json') keyManager = JsonKey(sourceName);
        else if (inferredType && (new inferredType) instanceof Class) {
            // Set default values
            from = from || Relation.formatKey(RelationDefinition.OwnerSymbol, Relation.formatAsId(keyName));
            to = to || Relation.formatKey(keyName, InternalKeys.Id);

            // Extract keys
            const [ sourceClassName, sourceKey ] = Relation.parseKey(from);
            const [ parentClassName, parentKey ] = Relation.parseKey(to);

            // Prepare relation definition
            const relationDefinition = new RelationDefinition(() => inferredType, sourceClassName, sourceKey, parentClassName, parentKey);

            // Prepare key manager
            keyManager = RelationKey(keyName, relationDefinition);

            // Set relation definition
            definition.relations[keyName] = relationDefinition;
        }

        // Set definition
        ClassDefinitionManager.set(classInstance.statics(), definition);

        // Get existing descriptor
        const descriptor = Object.getOwnPropertyDescriptor(classInstance, name);

        // Extend getter and setter
        Object.defineProperty(classInstance, name, {
            set(value) {
                // Parse value
                value = keyManager.setter(value);

                // If descriptor is defined
                if (descriptor && typeof descriptor.set === 'function') {
                    // Set value
                    descriptor.set.apply(this, [value]);
                } else this.keys.set(keyManager.name, value);
            },
            get() {
                // Prepare value
                let value = this.keys.get(keyManager.name);

                // If descriptor is defined
                if (descriptor && typeof descriptor.get === 'function') {
                    // Get formatted value
                    value = descriptor.get.apply(this);
                }

                // Format value
                value = keyManager.getter(value);

                // Return value
                return value;
            },
            enumerable: true,
            configurable: true,
        });
    };
};

/**
 * Key definition
 */
function key<C extends Class>(): (classInstance: C, name: string) => any;
function key<C extends Class>(opts: KeyOptions): (classInstance: C, name: string) => any;
function key<C extends Class>(classInstance: C, name: string): any;
function key<C extends Class>(classInstance: C, name: string, descriptor: any): any;
function key<C extends Class>(...args: [] | [KeyOptions] | [C, string] | [C, string, any]) {
    // As property decorator
    if (args.length === 2 || args.length === 3) {
        return keyDecorator()(args[0], args[1]);
    } else if (args.length === 1) {
        return keyDecorator(args[0]);
    } else {
        return keyDecorator();
    }
}

export default key;