import { KeyManager } from '../key';
import Error from '../../../../utils/error';
import { JsonAction } from '../../specials';

export default function JsonKey(name: string): KeyManager {
    const key = new KeyManager(name, 'json');
    key.setterDefinition = value => {
        // If null, set value to null
        if (typeof value === 'undefined' || value === null)
            return null;
        else if (typeof value === 'object') {
            if (JsonAction.isImplementedBy(value))
                return new JsonAction(value.type, name, value.path, value.value);
            else
                return JSON.stringify(value);
        } else
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must be a valid JSON object`);
    };

    key.getterDefinition = value => {
        try {
            // If null, set value to null
            if (typeof value === 'undefined' || value === null)
                return value;
            else if (typeof value === 'string')
                return JSON.parse(value);
            else if (value instanceof JsonAction)
                return null;
            else if (typeof value === 'object')
                return value;
            else
                return null;
        } catch (err) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` could not be fetched because it is an invalid JSON object`);
        }
    };

    return key;
}