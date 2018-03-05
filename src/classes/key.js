// @flow
/**
 * References
 */
import moment from 'moment-timezone';
import Increment from './specials/increment';
import { SetJson, AppendJson } from './specials/json';
import Error from '../utils/error';

export class KeyManager {

    _name: string;
    _isNew: boolean = false;
    _set: (key: string, value: any) => void;
    _get: (key: string) => any;
    _setter: (value: any) => void;
    _getter: () => any;

    constructor(name: string) {
        this._name = name;
    }

    set isNew(value: boolean) {
        this._isNew = value;
    }

    set set(set: (key: string, value: any) => void) {
        this._set = set;
    }

    set get(get: (key: string) => any) {
        this._get = get;
    }

    get name(): string {
        return this._name;
    }

    get setter(): (value: any) => void {
        return this._setter;
    }

    get getter(): () => any {
        return this._getter;
    }
}

export default function Key (name: string) {

    // Set name
    this.name = name;

    this.asString = (minLength?: number, maxLength?: number) => {
        const key = new KeyManager(this.name);
        key._setter = value => {
            if(typeof value === 'undefined' || value === null) key._set(this.name, null);
            else if(typeof minLength !== 'undefined' && value.length < minLength) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` must be at least ${minLength} characters`);
            }
            else if(typeof maxLength !== 'undefined' && value.length > maxLength) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` must not be more than ${maxLength} characters`);
            }

            key._set(this.this.name, value);
        };

        key._getter = () => {
            return key._get(this.this.name);
        };

        return key;
    };

    this.asDate = (format?: string) => {
        const key = new KeyManager(this.name);
        key._setter = value => {
            // If null, set value to null
            if(typeof value === 'undefined' || value === null) return key._set(this.name, null);

            // Get the date
            const date = moment(value);

            // If the date is not valid, throw an error
            if(!date.isValid()) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` is not a valid date`);
            }
            
            key._set(this.name, date.tz('UTC').format('YYYY-MM-DD HH:mm:ss'));
        };

        key._getter = () => {
            // Get the date
            const date = key._get(this.name);
            if(typeof date === 'undefined' || date === null) return null;
            else return moment(moment(date).format('YYYY-MM-DD HH:mm:ss') + '+00:00').tz('UTC').format(format);
        };

        return key;
    };

    this.asNumber = (min?: number, max?: number) => {
        const key = new KeyManager(this.name);
        key._setter = value => {
            // If null, set value to null
            if(typeof value === 'undefined' || value === null) 
                return key._set(this.this.name, null);
            else if(typeof value === 'object') {
                if(!Increment.isImplementedBy(value))
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` is not a valid increment object`);
                else
                    return key._set(this.name, new Increment(this.name, value));
            }
            else if(!isNaN(value)) {
                // If the number is not valid, throw an error
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` is not a valid number`);
            }
            else if(typeof min !== 'undefined' && value < min) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` must be greater than or equal to ${min}`);
            }
            else if(typeof max !== 'undefined' && value > max) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` must be less than or equal to ${max}`);
            }
            
            key._set(this.this.name, Number(value));
        };

        key._getter = () => {
            // Get the number
            const number = key._get(this.name);
            if(typeof number === 'undefined' || number === null) return null;
            else return Number(number);
        };
    };

    this.asFloat = (decimals?: number = 2, min?: number, max?: number) => {
        const key = new KeyManager(this.name);
        key._setter = value => {
            // If null, set value to null
            if(typeof value === 'undefined' || value === null) 
                return key._set(this.this.name, null);
            else if(typeof value === 'object') {
                if(!Increment.isImplementedBy(value))
                    throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` is not a valid Increment object`);
                else
                    return key._set(this.name, new Increment(this.name, value));
            }
            else if(!isNaN(value)) {
                // If the number is not valid, throw an error
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` is not a valid number`);
            }
            else if(typeof min !== 'undefined' && value < min) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` must be greater than or equal to ${min}`);
            }
            else if(typeof max !== 'undefined' && value > max) {
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${this.name}\` must be less than or equal to ${max}`);
            }
            
            key._set(this.this.name, Number(Number(value).toFixed(decimals)));
        };

        key._getter = () => {
            // Get the number
            const number = key._get(this.name);
            if(typeof number === 'undefined' || number === null) return null;
            else return Number(number);
        };

        return key;
    };

    this.asJSON = () => {
        const key = new KeyManager(this.name);
        key._setter = value => {
            // If null, set value to null
            if(typeof value === 'undefined' || value === null) 
                return key._set(this.name, null);
            else if(typeof value === 'object') {
                if(SetJson.isImplementedBy(value))
                    key._set(this.name, new SetJson(value, key._isNew));
                else if(AppendJson.isImplementedBy(value))
                    key._set(this.name, new AppendJson(value, key._isNew));
                else
                    key._set(this.name, JSON.stringify(value));
            }
            else
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must be a valid JSON object`);
        };

        key._getter = () => {
            // Get value
            const value = key._get(this.name);

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
    };
}