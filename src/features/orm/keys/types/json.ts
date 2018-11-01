import { KeyManager } from '../key';
import Error from '../../../../utils/error';
import { SetJson, AppendJson } from '../../specials';

export default function JSONKey(name: string): KeyManager {
    const key = new KeyManager(name, 'json');
    key.setterDefinition = value => {
        // If null, set value to null
        if(typeof value === 'undefined' || value === null) 
            return null;
        else if(typeof value === 'object') {
            if(SetJson.isImplementedBy(value))
                return new SetJson(name, value, key.isNew);
            else if(AppendJson.isImplementedBy(value))
                return new AppendJson(name, value, key.isNew);
            else
                return JSON.stringify(value);
        }
        else
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` must be a valid JSON object`);
    };

    key.getterDefinition = value => {
        try {
            // If null, set value to null
            if(typeof value === 'undefined' || value === null) 
                return value;
            else if(typeof value === 'string')
                return JSON.parse(value);
            else if(typeof value === 'object')
                return value;
            else
                return null;
        }
        catch(err) {
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${name}\` could not be fetched because it is invalid`);
        }
    };

    return key;
}