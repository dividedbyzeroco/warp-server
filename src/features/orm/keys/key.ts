import { toSnakeCase } from '../../../utils/format';
import { KeyOptions } from '../../../types/key';
import Class, { ClassDefinitionManager } from '../class';
import StringKey from './types/string';
import DateKey from './types/date';
import NumberKey from './types/number';
import JsonKey from './types/json';
import BooleanKey from './types/boolean';

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
        const { via } = opts;

        // Infer data type
        const inferredType = Reflect.getMetadata('design:type', classInstance, name);

        // Convert key name to snake case, then add to the key map
        const keyName = toSnakeCase(name);
        const sourceName = via || keyName;
        let keyManager = new KeyManager(keyName);

        // Get type from metadata
        if (typeof inferredType !== 'undefined') type = inferredType.name.toLowerCase();

        // Determine key manager
        if (type === 'string') keyManager = StringKey(sourceName, opts);
        else if (type === 'date') keyManager = DateKey(sourceName);
        else if (type === 'boolean') keyManager = BooleanKey(sourceName);
        else if (type === 'number') keyManager = NumberKey(sourceName, opts);
        else if (type === 'array') keyManager = JsonKey(sourceName);
        else if (type === 'object') keyManager = JsonKey(sourceName);
        else if (type === 'json') keyManager = JsonKey(sourceName);

        // Set definition
        const definition = ClassDefinitionManager.get(classInstance.statics());
        if (!definition.keys.includes(keyName) && !definition.timestamps.includes(keyName)) {
            definition.keys.push(keyName);
        }
        ClassDefinitionManager.set(classInstance.statics(), definition);

        // Override getter and setter
        return {
            set(value) {
                value = keyManager.setter(value);
                this.keys.set(keyManager.name, value);
            },
            get() {
                return keyManager.getter(this.keys.get(keyManager.name));
            },
            enumerable: true,
            configurable: true,
        };
    };
};

/**
 * Key Instance definition for legacy usage
 */
export class KeyInstance {

    private keyName: string;

    constructor(name: string) {
        this.keyName = name;
    }

    public asString = (minLength?: number, maxLength?: number) => StringKey(this.keyName, { minLength, maxLength });
    public asDate = () => DateKey(this.keyName);
    public asBoolean = () => BooleanKey(this.keyName);
    public asNumber = (max?: number, min?: number) => NumberKey(this.keyName, { type: 'number', min, max });
    public asInteger = (min?: number, max?: number) => NumberKey(this.keyName, { type: 'integer', min, max });
    public asFloat = (decimals: number = 2, min?: number, max?: number) => NumberKey(this.keyName, { type: 'float', decimals, min, max });
    public asJSON = () => JsonKey(this.keyName);

}

/**
 * Key definition
 */
function key<C extends Class>(): (classInstance: C, name: string) => any;
function key<C extends Class>(opts: KeyOptions): (classInstance: C, name: string) => any;
function key<C extends Class>(classInstance: C, name: string): any;
function key<C extends Class>(classInstance: C, name: string, descriptor: any): any;
function key(name: string): KeyInstance;
function key<C extends Class>(...args: [] | [KeyOptions] | [C, string] | [C, string, any] | [string]) {
    // As property decorator
    if (args.length === 2 || args.length === 3) {
        return keyDecorator()(args[0], args[1]);
    } else {
        // As property decorator without args
        if (args.length === 0) {
            return keyDecorator();
        } else if (typeof args[0] === 'string') {
            // Get name value
            const name = args[0];

            return new KeyInstance(name);
        } else {
            return keyDecorator(args[0]);
        }
    }
}

export default key;