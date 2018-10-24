import { KeyValuePair } from '../../../utils/key-map';

export default class Increment {

    _min: number;
    _max?: number;
    _keyValue: KeyValuePair;

    constructor(key: string, definition: object, min: number = 0, max?: number) {
        this._keyValue = new KeyValuePair(key, definition['value']);
        this._min = min;
        this._max = max;
    }

    static isImplementedBy(value) {
        if(value === null) return false;
        if(typeof value !== 'object') return false;
        if(value.type !== 'Increment') return false;
        if(isNaN(value.value)) return false;
        return true;
    }

    get key() {
        return this._keyValue.key;
    }

    get value() {
        return parseInt(this._keyValue.value);
    }

    get min() {
        return this._min;
    }

    get max() {
        return this._max;
    }
}