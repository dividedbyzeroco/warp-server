import 'reflect-metadata';
import { toSnakeCase } from '../../utils/format';
import { KeyDefinition, KeyOptions } from '../../types/key';
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

    keyName: string;
    isNewFlag: boolean = false;
    setterDefinition: (value: any) => any;
    getterDefinition: (value: any) => any;

    constructor(name: string) {
        this.keyName = name;
    }

    set isNew(value: boolean) {
        this.isNewFlag = value;
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
    <T extends Class>(classInstance: T, name: string) => {
        // Infer data type
        const type = Reflect.getMetadata('design:type', classInstance, name);

        // Convert key name to snake case, then add to the key map
        const keyName = toSnakeCase(name);
        let keyManager = new KeyManager(keyName);

        // Infer type
        switch(type) {
            case 'String': keyManager = StringKey(keyName, {}); break;
            case 'Date': keyManager = DateKey(keyName); break;
            case 'Boolean': keyManager = BooleanKey(keyName); break;
            case 'Number': keyManager = NumberKey(keyName, { type: 'number' }); break;
        }

        // Set key manager
        classInstance.statics()._keys[keyName] = keyManager;
    }
};

/**
 * Key definition
 * @param opts
 */
const Key = (...args: any[]) => {
    // As property decorator
    if(args.length === 0 || args.length === 1 && typeof args[0] === 'object') {
        return keyDecorator(args[0]);
    }
    // For legacy usage of Key
    else { 
        // Get name value
        const name = args[0];

        // Check if name is a string
        if(typeof name !== 'string') throw new Error(`Key() must have a string 'name' parameter`);

        // Instance
        const instance = { 
            type: 'Key', 
            name,
            asString: (minLength?: number, maxLength?: number) => StringKey(instance.name, { minLength, maxLength }),
            asDate: () => DateKey(instance.name),
            asBoolean: () => BooleanKey(instance.name),
            asNumber: (max?: number, min?: number) => NumberKey(instance.name, { type: 'number', min, max }),
            asInteger: (min?: number, max?: number) => NumberKey(instance.name, { type: 'integer', min, max }),
            asFloat: (decimals: number = 2, min?: number, max?: number) => NumberKey(instance.name, { type: 'float', decimals, min, max }),
            asJSON: () => JSONKey(instance.name)
        };

        return instance;
    }
}

export const keyIsImplementedBy = (value: KeyDefinition) => {
    if(typeof value !== 'object') return false;
    if(value.type === 'Key') return true;
    else return false;
};

export default Key;