import { Increment, SetJson, AppendJson } from './specials';
import { toDatabaseDate, toISODate } from '../utils/format';
import Error from '../utils/error';
import { KeyDefinition } from '../types/key';

export class KeyManager {

    _name: string;
    _isNew: boolean = false;
    _setter: (value: any) => any;
    _getter: (value: any) => any;

    constructor(name: string) {
        this._name = name;
    }

    set isNew(value: boolean) {
        this._isNew = value;
    }

    get name(): string {
        return this._name;
    }

    get setter(): (value: any) => any {
        return this._setter;
    }

    get getter(): (value: any) => any {
        return this._getter;
    }
}

function Key(name: string) {
    // Instance
    const instance = { 
        type: 'Key', 
        name: name,
        asString: (minLength?: number, maxLength?: number): KeyManager => {
            const key = new KeyManager(instance.name);
            key._setter = value => {
                if(typeof value === 'undefined' || value === null) return null;
                else if(typeof minLength !== 'undefined' && value.length < minLength) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be at least ${minLength} characters`);
                }
                else if(typeof maxLength !== 'undefined' && value.length > maxLength) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must not be more than ${maxLength} characters`);
                }
    
                return value;
            };
    
            key._getter = (value) => {
                return value;
            };
    
            return key;
        },
        asDate: (): KeyManager => {
            const key = new KeyManager(instance.name);
            key._setter = value => {
                // If null, set value to null
                if(typeof value === 'undefined' || value === null) return null;
    
                // If the date is not valid, throw an error
                try {
                    return toDatabaseDate(value);
                }
                catch(err) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid date`);
                }
            };
    
            key._getter = value => {
                // Get the date
                if(typeof value === 'undefined' || value === null) return null;
                else return toISODate(value);
            };
    
            return key;
        },
        asNumber: (min?: number, max?: number): KeyManager => {
            const key = new KeyManager(instance.name);
            key._setter = value => {
                // If null, set value to null
                if(typeof value === 'undefined' || value === null) 
                    return null;
                else if(typeof value === 'object') {
                    if(!Increment.isImplementedBy(value))
                        throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid increment object`);
                    else
                        return new Increment(instance.name, value);
                }
                else if(!isNaN(value)) {
                    // If the number is not valid, throw an error
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid number`);
                }
                else if(typeof min !== 'undefined' && value < min) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be greater than or equal to ${min}`);
                }
                else if(typeof max !== 'undefined' && value > max) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be less than or equal to ${max}`);
                }
                
                return Number(value);
            };
    
            key._getter = value => {
                // Get the number
                const number = value;
                if(typeof number === 'undefined' || number === null) return null;
                else return Number(number);
            };

            return key;
        },
        asInteger: (min?: number, max?: number): KeyManager => {
            const key = new KeyManager(instance.name);
            key._setter = value => {
                // If null, set value to null
                if(typeof value === 'undefined' || value === null) 
                    return null;
                else if(typeof value === 'object') {
                    if(!Increment.isImplementedBy(value))
                        throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid Increment object`);
                    else
                        return new Increment(instance.name, value);
                }
                else if(!isNaN(value)) {
                    // If the number is not valid, throw an error
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid number`);
                }
                else if(typeof min !== 'undefined' && value < min) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be greater than or equal to ${min}`);
                }
                else if(typeof max !== 'undefined' && value > max) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be less than or equal to ${max}`);
                }
                
                return parseInt(value);
            };

            key._getter = value => {
                // Get the number
                const number = value;
                if(typeof number === 'undefined' || number === null) return null;
                else return parseInt(number);
            };

            return key;
        },
        asFloat: (decimals: number = 2, min?: number, max?: number): KeyManager => {
            const key = new KeyManager(instance.name);
            key._setter = value => {
                // If null, set value to null
                if(typeof value === 'undefined' || value === null) 
                    return null;
                else if(typeof value === 'object') {
                    if(!Increment.isImplementedBy(value))
                        throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid Increment object`);
                    else
                        return new Increment(instance.name, value);
                }
                else if(!isNaN(value)) {
                    // If the number is not valid, throw an error
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` is not a valid number`);
                }
                else if(typeof min !== 'undefined' && value < min) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be greater than or equal to ${min}`);
                }
                else if(typeof max !== 'undefined' && value > max) {
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be less than or equal to ${max}`);
                }
                
                return Number(Number(value).toFixed(decimals));
            };

            key._getter = value => {
                // Get the number
                const number = value;
                if(typeof number === 'undefined' || number === null) return null;
                else return Number(Number(value).toFixed(decimals));
            };

            return key;
        },
        asJSON: (): KeyManager => {
            const key = new KeyManager(instance.name);
            key._setter = value => {
                // If null, set value to null
                if(typeof value === 'undefined' || value === null) 
                    return null;
                else if(typeof value === 'object') {
                    if(SetJson.isImplementedBy(value))
                        return new SetJson(instance.name, value, key._isNew);
                    else if(AppendJson.isImplementedBy(value))
                        return new AppendJson(instance.name, value, key._isNew);
                    else
                        return JSON.stringify(value);
                }
                else
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${instance.name}\` must be a valid JSON object`);
            };
    
            key._getter = value => {    
                // If null, set value to null
                if(typeof value === 'undefined' || value === null) 
                    return null;
                else if(typeof value === 'string')
                    return JSON.parse(value);
                else if(typeof value === 'object')
                    return value;
                else
                    return null;
            };
    
            return key;
        }
    };

    return instance;
}

export const keyIsImplementedBy = (value: KeyDefinition) => {
    if(typeof value !== 'object') return false;
    if(value.type === 'Key') return true;
    else return false;
};

export default Key;