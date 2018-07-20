import { Warp } from 'warp-sdk-js';
import User from './user';
import KeyMap from '../utils/key-map';
import { MetadataType } from '../types/class';
import { FunctionOptionsType } from '../types/functions';
export default class FunctionClass {
    _warp: Warp;
    _metadata: MetadataType;
    _currentUser: User;
    _keyMap: KeyMap;
    constructor({ metadata, currentUser, keys }?: FunctionOptionsType);
    statics<T extends typeof FunctionClass>(): T;
    set(key: string, value: any): void;
    get(key: string): any;
    bindSDK(warp: Warp): void;
    readonly Warp: Warp;
    readonly isMaster: boolean;
    readonly currentUser: any;
    static readonly functionName: string;
    static readonly masterOnly: boolean;
    run(): Promise<any>;
    execute(): Promise<any>;
}
