// References
import Database from '../services/database';
import { KeyValue } from '../utils/key-map';

export default class Increment {

    constructor(key, definition) {
        this._keyValue = new KeyValue(key, definition.value);
    }

    get key() {
        return Database.escapeKey(this._keyValue.key);
    }

    get value() {
        return Database.escape(parseInt(this._keyValue.value));
    }

    isImplementedBy(value) {
        if(value === null) return false;
        if(typeof value !== 'object') return false;
        if(value.type !== 'Increment') return false;
        if(isNaN(value.value)) return false;
        return true;
    }

    toString() {
        return `IFNULL(${this.key}, 0) + (${parseInt(this.value)})`;
    }
}