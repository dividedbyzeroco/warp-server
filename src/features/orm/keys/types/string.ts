import { KeyManager } from '../key';
import Error from '../../../../utils/error';

export interface StringOptions {
    minLength?: number;
    maxLength?: number;
}

export default function StringKey(name): KeyManager {

    const key = new KeyManager(name, 'string');
    key.setterDefinition = value => {
        if (typeof value === 'undefined' || value === null) return null;
        return value;
    };

    key.getterDefinition = (value) => {
        return value;
    };

    return key;
}