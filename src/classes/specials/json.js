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

class JsonAppend {

    constructor(key, definition, isNew = false) {
        this._isNew = isNew;
        this._keyValue = new KeyValue(key, definition.value);
        this._path = definition.path;
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

    isImplementedBy(value) {
        if(value === null) return false;
        if(typeof value !== 'object') return false;
        if(value.type !== 'JsonAppend') return false;
        return true;
    }

    toString() {
        const key = this.isNew? 'JSON_ARRAY()' : `IFNULL(${this.key}, JSON_ARRAY())`;
        const path = this.isNew? '$' : this.path;
        const value = isJson(this.value)? `CAST(${this.value} AS JSON)` : this.value;
        return `JSON_ARRAY_APPEND(${key}, ${path}, ${value})`;
    }

}

class JsonSet {

    constructor(key, definition, isNew = false) {
        this._isNew = isNew;
        this._keyValue = new KeyValue(key, definition.value);
        this._path = definition.path;
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

    isImplementedBy(value) {
        if(value === null) return false;
        if(typeof value !== 'object') return false;
        if(value.type !== 'JsonSet') return false;
        return true;
    }

    toString() {
        const key = this.isNew? 'JSON_OBJECT()' : `IFNULL(${this.key}, JSON_OBJECT())`;
        const path = this.isNew? '$' : this.path;
        const value = isJson(this.value)? `CAST(${this.value} AS JSON)` : this.value;
        return `JSON_SET(${key}, ${path}, ${value})`;
    }

}

export {
    JsonAppend,
    JsonSet
};