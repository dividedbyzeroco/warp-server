import Database from '../services/database';
import { KeyValue } from '../utils/key-map';

const isJson = str => {
    try {
        JSON.parse(str);
    }
    catch (err) {
        return false;
    }
    return true;
};

class AppendJson {

    constructor(key, definition, isNew = false) {
        this._isNew = isNew;
        this._keyValue = new KeyValue(key, definition.value);
        this._path = definition.path;
    }

    static isImplementedBy(value) {
        if(value === null) return false;
        if(typeof value !== 'object') return false;
        if(value.type !== 'AppendJson') return false;
        return true;
    }

    get isNew() {
        return this._isNew;
    }

    get key() {
        return Database.escapeKey(this._keyValue.key);
    }

    get value() {
        return Database.escape(this._keyValue.value);
    }

    get path() {
        return Database.escape(this._path);
    }

    toString() {
        const key = this.isNew? 'JSON_ARRAY()' : `IFNULL(${this.key}, JSON_ARRAY())`;
        const path = this.isNew? '$' : this.path;
        const value = isJson(this.value)? `CAST(${this.value} AS JSON)` : this.value;
        return `JSON_ARRAY_APPEND(${key}, ${path}, ${value})`;
    }

}

class SetJson {

    constructor(key, definition, isNew = false) {
        this._isNew = isNew;
        this._keyValue = new KeyValue(key, definition.value);
        this._path = definition.path;
    }

    static isImplementedBy(value) {
        if(value === null) return false;
        if(typeof value !== 'object') return false;
        if(value.type !== 'SetJson') return false;
        return true;
    }

    get isNew() {
        return this._isNew;
    }

    get key() {
        return Database.escapeKey(this._keyValue.key);
    }

    get value() {
        return Database.escape(this._keyValue.value);
    }

    get path() {
        return Database.escape(this._path);
    }

    toString() {
        const key = this.isNew? 'JSON_OBJECT()' : `IFNULL(${this.key}, JSON_OBJECT())`;
        const path = this.isNew? '$' : this.path;
        const value = isJson(this.value)? `CAST(${this.value} AS JSON)` : this.value;
        return `JSON_SET(${key}, ${path}, ${value})`;
    }

}

export {
    AppendJson,
    SetJson
};