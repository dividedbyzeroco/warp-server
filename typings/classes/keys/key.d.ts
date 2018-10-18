import 'reflect-metadata';
import { KeyOptions } from '../../types/key';
import Class from '../class';
/**
 * Key Manager
 * @description Handler for getters and setters
 */
export declare class KeyManager {
    keyName: string;
    isNewFlag: boolean;
    setterDefinition: (value: any) => any;
    getterDefinition: (value: any) => any;
    constructor(name: string);
    isNew: boolean;
    readonly name: string;
    readonly setter: (value: any) => any;
    readonly getter: (value: any) => any;
}
/**
 * Key Decorator
 * @param opts
 */
export declare const keyDecorator: (opts?: KeyOptions | undefined) => <T extends Class>(classInstance: T, name: string) => void;
/**
 * Key Instance definition for legacy usage
 */
export declare class KeyInstance {
    _name: string;
    constructor(name: string);
    asString: (minLength?: number | undefined, maxLength?: number | undefined) => KeyManager;
    asDate: () => KeyManager;
    asBoolean: () => KeyManager;
    asNumber: (max?: number | undefined, min?: number | undefined) => KeyManager;
    asInteger: (min?: number | undefined, max?: number | undefined) => KeyManager;
    asFloat: (decimals?: number, min?: number | undefined, max?: number | undefined) => KeyManager;
    asJSON: () => KeyManager;
}
/**
 * Key definition
 */
declare function Key(): void;
declare function Key(opts: KeyOptions): void;
declare function Key<T extends Class>(classInstance: T, name: string): void;
declare function Key(name: string): KeyInstance;
export default Key;
