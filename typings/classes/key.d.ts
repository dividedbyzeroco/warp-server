import { KeyDefinition } from '../types/key';
export declare class KeyManager {
    _name: string;
    _isNew: boolean;
    _setter: (value: any) => any;
    _getter: (value: any) => any;
    constructor(name: string);
    isNew: boolean;
    readonly name: string;
    readonly setter: (value: any) => any;
    readonly getter: (value: any) => any;
}
declare function Key(name: string): {
    type: string;
    name: string;
    asString: (minLength?: number | undefined, maxLength?: number | undefined) => KeyManager;
    asDate: () => KeyManager;
    asNumber: (min?: number | undefined, max?: number | undefined) => KeyManager;
    asInteger: (min?: number | undefined, max?: number | undefined) => KeyManager;
    asFloat: (decimals?: number, min?: number | undefined, max?: number | undefined) => KeyManager;
    asJSON: () => KeyManager;
};
export declare const keyIsImplementedBy: (value: KeyDefinition) => boolean;
export default Key;
