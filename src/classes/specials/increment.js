// References
import Database from '../../adapters/database';
import { KeyValue } from '../../utils/key-map';

export default class Increment {

    _min;
    _max;

    constructor(key, definition, min = 0, max) {
        this._keyValue = new KeyValue(key, definition.value);
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
        return Database.escapeKey(this._keyValue.key);
    }

    get value() {
        return Database.escape(parseInt(this._keyValue.value));
    }

    get min() {
        return this._min;
    }

    get max() {
        return this._max;
    }

    toString() {
        let value = `GREATEST(IFNULL(${this.key}, 0) + (${parseInt(this.value)}), ${this.min})`;
        if(typeof this.max !== 'undefined') value = `LEAST(${value}, ${this.max})`;
        return value;
    }
}