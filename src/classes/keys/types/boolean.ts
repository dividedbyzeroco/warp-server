import { KeyManager } from '../key';
import Error from '../../../utils/error';

export default function BooleanKey(name: string): KeyManager {
    const key = new KeyManager(name, 'boolean');
    key.setterDefinition = value => {
        // If null, set value to null
        if(typeof value === 'undefined' || value === null) return null;

        // If value is not a boolean, throw an error
        if(typeof value !== 'boolean')
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` is not a valid date`);

        return value ? 1 : 0;
    };

    key.getterDefinition = value => {
        // Get the date
        if(typeof value === 'undefined' || value === null) return null;
        else return value === 1 ? true : false;
    };

    return key;
}