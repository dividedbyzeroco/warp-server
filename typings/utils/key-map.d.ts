declare class KeyValuePair {
    /**
     * Private properties
     */
    _key: string;
    _value: any;
    _alias: string;
    /**
     * Constructor
     * @param {String} key
     * @param {*} value
     * @param {String} key
     */
    constructor(key: string, value: any, alias?: string);
    readonly key: string;
    value: any;
    alias: string;
}
export { KeyValuePair };
export default class KeyMap {
    /**
     * Private properties
     */
    _map: {
        [key: string]: KeyValuePair;
    };
    _immutable: boolean;
    /**
     * Constructor
     * @param {Object} keyValuePairs
     * @param {Boolean} immutable
     */
    constructor(keyValuePairs?: {
        [key: string]: any;
    }, immutable?: boolean);
    set(key: string, value: any): void;
    setAlias(key: string, alias: string): void;
    remove(key: string): void;
    get(key: string): any;
    getAlias(key: string): string;
    getKeys(): string[];
    has(key: string): boolean;
    toList(): Array<KeyValuePair>;
    getAliases(): string[];
    setImmutability(immutability: boolean): void;
    toJSON(): Object;
}
