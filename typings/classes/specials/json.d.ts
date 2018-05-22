import { KeyValuePair } from '../../utils/key-map';
import { JsonDefinition } from '../../types/json';
declare class SetJson {
    _isNew: boolean;
    _keyValue: KeyValuePair;
    _path: string;
    constructor(key: string, definition: JsonDefinition, isNew?: boolean);
    static isImplementedBy(value: any): boolean;
    readonly isNew: boolean;
    readonly key: string;
    readonly value: string;
    readonly path: string;
}
declare class AppendJson {
    _isNew: boolean;
    _keyValue: KeyValuePair;
    _path: string;
    constructor(key: string, definition: JsonDefinition, isNew?: boolean);
    static isImplementedBy(value: any): boolean;
    readonly isNew: boolean;
    readonly key: string;
    readonly value: string;
    readonly path: string;
}
export { SetJson, AppendJson };
