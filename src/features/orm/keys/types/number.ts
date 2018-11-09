import { KeyManager } from '../key';
import Error from '../../../../utils/error';
import { Increment } from '../../specials';
import { KeyType } from '../../../../types/key';

export type NumberKeyOptions = {
    type?: KeyType,
    decimals?: number,
    min?: number,
    max?: number
};

export default function NumberKey(name: string, opts: NumberKeyOptions = {}): KeyManager {
    const { type = 'number', decimals = 2, min, max } = opts;
    
    const key = new KeyManager(name, 'number');
    key.setterDefinition = value => {
        // If null, set value to null
        if(typeof value === 'undefined' || value === null) 
            return null;
        else if(typeof value === 'object') {
            if(!Increment.isImplementedBy(value))
                throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` is not a valid increment object`);
            else
                return new Increment(name, value, min, max);
        }
        else if(isNaN(value)) {
            // If the number is not valid, throw an error
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` is not a valid number`);
        }
        else if(typeof min !== 'undefined' && value < min) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must be greater than or equal to ${min}`);
        }
        else if(typeof max !== 'undefined' && value > max) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must be less than or equal to ${max}`);
        }
        
        if(type === 'integer') return parseInt(value);
        else if(type === 'float') return Number(Number(value).toFixed(decimals));
        else return Number(value);
    };

    key.getterDefinition = value => {
        // Get the number
        const number = value;
        if(typeof number === 'undefined' || number === null) return number;
        else {
            if(type === 'integer') return parseInt(number);
            else if(type === 'float') return Number(Number(value).toFixed(decimals));
            else return Number(number);
        }
    };

    return key;
}