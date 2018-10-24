import { KeyValuePair } from '../../../utils/key-map';
import { JsonDefinition } from '../../../types/json';

class SetJson {
    
    _isNew: boolean;
    _keyValue: KeyValuePair;
    _path: string;

    constructor(key: string, definition: JsonDefinition, isNew: boolean = false) {
        this._isNew = isNew;
        this._keyValue = new KeyValuePair(key, definition.value);
        this._path = definition.path;
    }

    static isImplementedBy(value: any) {
        if(value === null) return false;
        if(value['type'] !== 'SetJson') return false;
        return true;
    }

    get isNew(): boolean {
        return this._isNew;
    }

    get key(): string {
        return this._keyValue.key;
    }

    get value(): string {
        return this._keyValue.value;
    }

    get path(): string {
        return this._path;
    }
}

class AppendJson {

    _isNew: boolean;
    _keyValue: KeyValuePair;
    _path: string;

    constructor(key: string, definition: JsonDefinition, isNew: boolean = false) {
        this._isNew = isNew;
        this._keyValue = new KeyValuePair(key, definition.value);
        this._path = definition.path;
    }

    static isImplementedBy(value: any) {
        if(value === null) return false;
        if(value.type !== 'AppendJson') return false;
        return true;
    }

    get isNew(): boolean {
        return this._isNew;
    }

    get key(): string {
        return this._keyValue.key;
    }

    get value(): string {
        return this._keyValue.value;
    }

    get path(): string {
        return this._path;
    }
}

export {
    SetJson,
    AppendJson
};