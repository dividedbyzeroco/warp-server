import { KeyManager } from '../key';
import Error from '../../../utils/error';
import { SetJson, AppendJson } from '../../specials';

export default function JSONKey(name: string): KeyManager {
    const key = new KeyManager(name);
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