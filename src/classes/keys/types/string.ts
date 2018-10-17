import { KeyManager } from '../key';
import Error from '../../../utils/error';

export type StringOptions = {
    minLength?: number,
    maxLength?: number
};

export default function StringKey(name, opts: StringOptions): KeyManager {
    const { minLength, maxLength } = opts;
    
    const key = new KeyManager(name);
    key.setterDefinition = value => {
        if(typeof value === 'undefined' || value === null) return null;
        else if(typeof minLength !== 'undefined' && value.length < minLength) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must be at least ${minLength} characters`);
        }
        else if(typeof maxLength !== 'undefined' && value.length > maxLength) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must not be more than ${maxLength} characters`);
        }

        return value;
    };

    key.getterDefinition = (value) => {
        return value;
    };

    return key;
}