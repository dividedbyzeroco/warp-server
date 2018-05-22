import { KeyValuePair } from '../../utils/key-map';
export default class Increment {
    _min: number;
    _max?: number;
    _keyValue: KeyValuePair;
    constructor(key: string, definition: object, min?: number, max?: number);
    static isImplementedBy(value: any): boolean;
    readonly key: string;
    readonly value: number;
    readonly min: number;
    readonly max: number | undefined;
}
