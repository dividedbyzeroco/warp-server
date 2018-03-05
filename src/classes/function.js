// @flow
/**
 * References
 */
import User from './user';
import { toCamelCase } from '../utils/format';
import KeyMap from '../utils/key-map';
import Error from '../utils/error';
import type { MetadataType } from '../types/model';
import type { FunctionOptionsType } from '../types/functions';

class FunctionClass {

    _metadata: MetadataType;
    _currentUser: User.Class;
    _keyMap: KeyMap = new KeyMap();

    constructor({ metadata, currentUser, keys }: FunctionOptionsType = {}) {
        // Check if metadata is provided
        if(typeof metadata !== 'undefined') this._metadata = metadata;

        // Check if current user is provided
        if(typeof currentUser !== 'undefined') this._currentUser = currentUser;
        
        // Iterate through each param
        for(let key in keys) {

            // Get value
            let value = keys[key];

            // Check if setter exists
            const keyDescriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, toCamelCase(key));
            if(keyDescriptor && typeof keyDescriptor['set'] === 'function') {
                const setter = keyDescriptor['set'].bind(this);
                setter(value);
            }
            // Otherwise, generically set the value
            else this.set(key, value);
        }

        // After setting values, make the key map immutable
        this._keyMap.setImmutability(true);
    }

    set(key: string, value: any) {
        this._keyMap.set(key, value);
    }

    get(key: string) {
        this._keyMap.get(key);
    }

    get isMaster(): boolean {
        return this._metadata.isMaster;
    }

    static get functionName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Functions extended from `Function.Class` must define a static getter for functionName');
    }

    static get masterOnly(): boolean {
        return false;
    }

    async run() {
        return;
    }

    async execute() {
        // Check if master is required
        if(this.constructor.masterOnly && (typeof this._metadata === 'undefined' || !this.isMaster))
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