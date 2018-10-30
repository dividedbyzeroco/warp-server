import { toSnakeCase } from '../../../utils/format';
import { KeyOptions } from '../../../types/key';
import Class from '../class';
import StringKey from './types/string';
import DateKey from './types/date';
import NumberKey from './types/number';
import JSONKey from './types/json';
import BooleanKey from './types/boolean';

/**
 * Key Manager
 * @description Handler for getters and setters
 */
export class KeyManager {

    private keyType: string;
    private keyName: string;
    private isNewFlag: boolean = false;
    setterDefinition: (value: any) => any = value => value;
    getterDefinition: (value: any) => any = value => value;

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
export const keyDecorator = (opts?: KeyOptions) => {
    return <C extends Class>(classInstance: C, name: string): any => {
        // Infer data type
        const type = Reflect.getMetadata('design:type', classInstance, name);

        // Convert key name to snake case, then add to the key map
        const keyName = toSnakeCase(name);
        const sourceName = opts && opts.via || keyName;
        let keyManager = new KeyManager(keyName);

        // Infer type
        if(typeof type !== 'undefined') {
            const typeName = type.name.toLowerCase();
            if(typeName === 'string') keyManager = StringKey(sourceName, opts);
            else if(typeName === 'date') keyManager = DateKey(sourceName);
            else if(typeName === 'boolean') keyManager = BooleanKey(sourceName);
            else if(typeName === 'number') keyManager = NumberKey(sourceName, opts);
            else if(typeName === 'array') keyManager = JSONKey(sourceName);
            else if(typeName === 'object') keyManager = JSONKey(sourceName);
        }

        // Set definition
        const definition = classInstance.getDefinition();
        if(!definition.keys.includes(keyName)) definition.keys.push(keyName);
        classInstance.setDefinition(definition);

        // Override getter and setter
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
    }
};

/**
 * Key Instance definition for legacy usage
 */
export class KeyInstance {
    
    _name: string;
    
    constructor(name: string) {
        this._name = name;
    }

    asString = (minLength?: number, maxLength?: number) => StringKey(this._name, { minLength, maxLength });
    asDate = () => DateKey(this._name);
    asBoolean = () => BooleanKey(this._name);
    asNumber = (max?: number, min?: number) => NumberKey(this._name, { numType: 'number', min, max });
    asInteger = (min?: number, max?: number) => NumberKey(this._name, { numType: 'integer', min, max });
    asFloat = (decimals: number = 2, min?: number, max?: number) => NumberKey(this._name, { numType: 'float', decimals, min, max });
    asJSON = () => JSONKey(this._name);

}

/**
 * Key definition
 */
function Key<C extends Class>(): (classInstance: C, name: string) => any;
function Key<C extends Class>(opts: KeyOptions): (classInstance: C, name: string) => any;
function Key<C extends Class>(classInstance: C, name: string): any;
function Key<C extends Class>(classInstance: C, name: string, descriptor: any): any;
function Key(name: string): KeyInstance;
function Key<C extends Class>(...args: [] | [KeyOptions] | [C, string] | [C, string, any] | [string]) {
    // As property decorator
    if(args.length === 2 || args.length === 3) {
        return keyDecorator()(args[0], args[1]);
    }
    // With args
    else {
        // As property decorator without args
        if(args.length === 0) {
            return keyDecorator();
        }
        // For legacy usage of Key
        else if(typeof args[0] === 'string') {
            // Get name value
            const name = args[0];

            return new KeyInstance(name);
        }
        // As property decorator with args
        else { 
            return keyDecorator(args[0]);
        }
    }
}

export default Key;