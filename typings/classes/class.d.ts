import { Warp } from 'warp-sdk-js';
import KeyMap from '../utils/key-map';
import ClassCollection from '../utils/class-collection';
import ConstraintMap from '../utils/constraint-map';
import { IDatabaseAdapter } from '../types/database';
import { FindOptionsType, SubqueryOptionsType } from '../types/database';
import { ClassOptionsType, MetadataType, QueryOptionsType, QueryGetOptionsType, PointerObjectType } from '../types/class';
export declare class Pointer {
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
    static validateKey(key: string, classType: typeof Class): void;
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
export default class Class {
    static _database: IDatabaseAdapter;
    static _supportLegacy: boolean;
    static _keys: {
        [name: string]: any;
    };
    static _joins: {
        [name: string]: Pointer;
    };
    static _hidden: {
        [name: string]: string;
    };
    static _protected: {
        [name: string]: string;
    };
    static _timestamps: {
        [name: string]: boolean;
    };
    _warp?: Warp;
    _metadata: MetadataType;
    _currentUser: any;
    _isNew: boolean;
    _id: number;
    _keyMap: KeyMap;
    _isPointer: boolean;
    /**
     * Constructor
     * @param {Object} params
     * @param {Number} id
     */
    constructor({ metadata, currentUser, keys, keyMap, id, createdAt, updatedAt, isPointer }?: ClassOptionsType);
    /**
     * Initialize
     * @description Function that must be invoked once
     * in order to initialize the class
     * @param {IDatabaseAdapter} database
     * @returns {WarpServer}
     */
    static initialize<T extends typeof Class>(database: IDatabaseAdapter, supportLegacy?: boolean): T;
    static readonly isClass: boolean;
    static readonly className: string;
    static readonly source: string;
    static readonly keys: Array<any>;
    static readonly hidden: Array<string>;
    static readonly protected: Array<string>;
    static readonly supportLegacy: boolean;
    static readonly _compoundDelimiter: string;
    static _isCompoundKey(key: string): boolean;
    static _getCompoundKeys(key: string): string[];
    static _keyExists(key: string): boolean;
    static _getQueryKeys(select: Array<string>, include: Array<string>): {
        keys: string[];
        joins: {};
    };
    static _checkQueryConstraints(where: ConstraintMap, classAlias: string): void;
    static _getQuerySorting(sort: Array<string | object>): Array<string>;
    static _getQueryClass<T extends Class>(keys: KeyMap): T;
    /**
     * Get subquery
     */
    static getSubquery({ where, select }: SubqueryOptionsType): FindOptionsType;
    /**
     * Find matching objects
     */
    static find<T extends Class>({ select, include, where, sort, skip, limit }: QueryOptionsType): Promise<ClassCollection<T>>;
    /**
     * Find a single object
     */
    static getById<T extends Class>({ select, include, id }: QueryGetOptionsType): Promise<T | void>;
    /**
     * @description Create a pointer
     * @param {string} key
     * @returns {WarpServer.Pointer}
     */
    static as(key: string): Pointer;
    statics<T extends typeof Class>(): T;
    readonly Warp: Warp | undefined;
    readonly isNew: boolean;
    id: number;
    readonly currentUser: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
    readonly sessionToken: string | void;
    readonly appClient: string | void;
    readonly appVersion: string | void;
    readonly sdkVersion: string | void;
    readonly isMaster: boolean;
    /**
     * Generic setter for all keys
     * @param {String} key
     * @param {*} value
     */
    set(key: string, value: any): void;
    /**
     * Generic getter for all keys
     * @param {String} key
     * @param {*} value
     */
    get(key: string): any;
    /**
     * toPointer
     * @description Convert the class object into a pointer
     */
    toPointer(): void;
    /**
     * toJSON
     * @description Executed every time the object is stringified
     */
    toJSON(): object;
    bindSDK(warp?: Warp): void;
    runAsMaster(enclosed: () => Promise<any>): Promise<void>;
    /**
     * Save the object
     */
    save(): Promise<void>;
    /**
     * Destroy the object
     */
    destroy(): Promise<void>;
    beforeFind(): Promise<void>;
    beforeSave(): Promise<void>;
    afterSave(): Promise<void>;
    beforeDestroy(): Promise<void>;
    afterDestroy(): Promise<void>;
}
