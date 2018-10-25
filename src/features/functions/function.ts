import User from '../auth/user';
import { toCamelCase } from '../../utils/format';
import KeyMap from '../../utils/key-map';
import Error from '../../utils/error';

export default class FunctionClass {

    // @deprecated
    private user: User;
    private keys: KeyMap = new KeyMap();

    constructor(keys: { [name: string]: any } = {}, user?: User) {
        // Check if current user is provided
        if(typeof user !== 'undefined' && user !== null) this.user = user;
        
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
        this.keys.setImmutability(true);
    }

    statics<T extends typeof FunctionClass>(): T {
        return this.constructor as T;
    }

    // @deprecated
    set(key: string, value: any) {
        this.keys.set(key, value);
    }

    // @deprecated
    get(key: string) {
        return this.keys.get(key);
    }

    get currentUser(): any {
        return this.user;
    }

    static get functionName(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Functions extended from `Function.Class` must define a static getter for functionName');
    }

    static get masterOnly(): boolean {
        return false;
    }

    async run(params?: object, user?: User): Promise<any> {
        return;
    }

    async execute() {
        // Check if master is required
        // TODO: Change implementation
        // if(this.statics().masterOnly && (typeof this._metadata === 'undefined' || !this.isMaster))
        //     throw new Error(Error.Code.ForbiddenOperation, `This function is only accessible via master`);

        return await this.run(this.keys.toJSON(), this.user);
    }

}