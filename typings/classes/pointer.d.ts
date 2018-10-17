import { PointerObjectType } from '../types/class';
import Class from './class';
export default class Pointer {
    _class: typeof Class;
    _aliasKey: string;
    _viaKey: string;
    _pointerIdKey: string;
    _isSecondary: boolean;
    _parentAliasKey: string;
    _parentViaKey: string;
    /**
     * Constructor
     * @param {Class} classType
     * @param {String} key
     */
    constructor(classType: typeof Class, key: string);
    static readonly Delimiter: string;
    static readonly IdDelimiter: string;
    static isUsedBy(key: string): boolean;
    static isUsedAsIdBy(key: string): boolean;
    static isValid(key: string): boolean;
    static getAliasFrom(key: string): string;
    static getPointerIdKeyFrom(key: string): string;
    static getKeyFrom(key: string): string;
    static getViaKeyFrom(key: string): string;
    static readonly Pointer: typeof Pointer;
    readonly statics: typeof Pointer;
    readonly class: typeof Class;
    readonly aliasKey: string;
    readonly viaKey: string;
    readonly pointerIdKey: string;
    readonly isSecondary: boolean;
    readonly parentAliasKey: string;
    readonly parentViaKey: string;
    via(key: string): this;
    to(key: string): this;
    from(key: string): this;
    isImplementedBy(value: object): boolean;
    toObject(value?: number | object): PointerObjectType | null;
}
