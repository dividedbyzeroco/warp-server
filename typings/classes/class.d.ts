import KeyMap from '../utils/key-map';
import { ClassOptionsType } from '../types/class';
import Pointer from './pointer';
export default class Class {
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
    _isNew: boolean;
    _id: number;
    _keyMap: KeyMap;
    _isPointer: boolean;
    /**
     * Constructor
     * @param {Object} params
     * @param {Number} id
     */
    constructor({ keys, keyMap, id, createdAt, updatedAt, isPointer }?: ClassOptionsType);
    /**
     * Class definition decorator
     * @description Defines and initializes the class
     * @param {String} className
     * @param {String} source
     */
    static of(className: string, source?: string): <T extends new (...args: any[]) => Class>(constructor: T) => {
        new (...args: any[]): {
            _isNew: boolean;
            _id: number;
            _keyMap: KeyMap;
            _isPointer: boolean;
            statics<T extends typeof Class>(): T;
            readonly isNew: boolean;
            id: number;
            createdAt: string;
            updatedAt: string;
            deletedAt: string;
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
            beforeFind(): Promise<void>;
            beforeSave(): Promise<void>;
            afterSave(): Promise<void>;
            beforeDestroy(): Promise<void>;
            afterDestroy(): Promise<void>;
        };
        readonly className: string;
        readonly source: string;
    } & T;
    /**
     * Initialize
     * @description Function that must be invoked once
     * in order to initialize the class
     * @param {IDatabaseAdapter} database
     * @returns {WarpServer}
     */
    static initialize<T extends typeof Class>(supportLegacy?: boolean): T;
    static readonly className: string;
    static readonly source: string;
    static readonly keys: Array<any>;
    static readonly hidden: Array<string>;
    static readonly protected: Array<string>;
    static readonly supportLegacy: boolean;
    /**
     * @description Check if provided key exists for the class
     * @param {String} key
     */
    static has(key: string): boolean;
    static hasPointer(key: string): void;
    /**
     * Get the constraint key format of the supplied key
     * @param {String} key
     */
    static getConstraintKey(key: string): string;
    /**
     * @description Create a pointer
     * @param {string} key
     * @returns {WarpServer.Pointer}
     */
    static as(key: string): Pointer;
    statics<T extends typeof Class>(): T;
    readonly isNew: boolean;
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
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
    beforeFind(): Promise<void>;
    beforeSave(): Promise<void>;
    afterSave(): Promise<void>;
    beforeDestroy(): Promise<void>;
    afterDestroy(): Promise<void>;
}
