import { Warp } from 'warp-sdk-js';
import User from './user';
import { toCamelCase } from '../utils/format';
import KeyMap from '../utils/key-map';
import Error from '../utils/error';
import { MetadataType } from '../types/class';
import { FunctionOptionsType } from '../types/functions';

export class FunctionClass {

    _warp: Warp;
    _metadata: MetadataType;
    _currentUser: User;
    _keyMap: KeyMap = new KeyMap();

    constructor({ metadata, currentUser, keys }: FunctionOptionsType = {}) {
        // Check if metadata is provided
        if(typeof metadata !== 'undefined') this._metadata = metadata;

        // Check if current user is provided
        if(typeof currentUser !== 'undefined') this._currentUser = currentUser;
        
        // Iterate through each param
        if(typeof keys !== 'undefined') {
            for(let key in keys) {

                // Get value
                let value = keys[key];

                // Check if setter exists
                const keyDescriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, toCamelCase(key));
                if(keyDescriptor && typeof keyDescriptor.set === 'function') {
                    const setter = keyDescriptor.set.bind(this);
                    setter(value);
                }
                // Otherwise, generically set the value
                else this.set(key, value);
            }
        } 

        // After setting values, make the key map immutable
        this._keyMap.setImmutability(true);
    }

    statics<T extends typeof FunctionClass>(): T {
        return this.constructor as T;
    }

    set(key: string, value: any) {
        this._keyMap.set(key, value);
    }

    get(key: string) {
        this._keyMap.get(key);
    }

    bindSDK(warp: Warp) {
        this._warp = warp;
    }

    get Warp(): Warp {
        return this._warp;
    }

    get isMaster(): boolean {
        return !!this._metadata.isMaster;
    }

    static get functionName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Functions extended from `Function.Class` must define a static getter for functionName');
    }

    static get masterOnly(): boolean {
        return false;
    }

    async run(): Promise<any> {
        return;
    }

    async execute() {
        // Check if master is required
        if(this.statics().masterOnly && (typeof this._metadata === 'undefined' || !this.isMaster))
            throw new Error(Error.Code.ForbiddenOperation, `This function is only accessible via master`);

        return await this.run();
    }

}

export default class Function {

    // Static getter for function class
    static get Class(): typeof FunctionClass {
        return FunctionClass;
    }
    
}