import { KeyManager } from '../key';
import Error from '../../../utils/error';
import { toDatabaseDate, toISODate } from '../../../utils/format';

export default function DateKey(name: string): KeyManager {
    const key = new KeyManager(name);
    key.setterDefinition = value => {
        // If null, set value to null
        if(typeof value === 'undefined' || value === null) return null;

        // If the date is not valid, throw an error
        try {
            return toDatabaseDate(value);
        }
        catch(err) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` is not a valid date`);
        }
    };

    key.getterDefinition = value => {
        // Get the date
        if(typeof value === 'undefined' || value === null) return null;
        else return toISODate(value);
    };

    return key;
}