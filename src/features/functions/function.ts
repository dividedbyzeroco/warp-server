import User from '../auth/user';
import { toCamelCase } from '../../utils/format';
import KeyMap from '../../utils/key-map';
import Error from '../../utils/error';
import { FunctionOptions } from '../../types/functions';

export default class FunctionClass {

    // @deprecated
    private user: User;
    private keys: KeyMap = new KeyMap();

    constructor(keys: { [name: string]: any } = {}, user?: User) {
        // Check if current user is provided
        if (typeof user !== 'undefined' && user !== null) this.user = user;

        // Iterate through each param
        if (typeof keys !== 'undefined') {
            for (const key in keys) {

                // Get value
                const value = keys[key];

                // Check if setter exists
                const keyDescriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, toCamelCase(key));
                if (keyDescriptor && typeof keyDescriptor.set === 'function') {
                    const setter = keyDescriptor.set.bind(this);
                    setter(value);
                } else this.set(key, value);
            }
        }

        // After setting values, make the key map immutable
        this.keys.freeze();
    }

    public statics<T extends typeof FunctionClass>(): T {
        return this.constructor as T;
    }

    // @deprecated
    public set(key: string, value: any) {
        this.keys.set(key, value);
    }

    // @deprecated
    public get(key: string) {
        return this.keys.get(key);
    }

    get currentUser(): any {
        return this.user;
    }

    static get functionName(): string | void {
        return;
    }

    static get masterOnly(): boolean {
        return false;
    }

    public run<U extends User | undefined>(params?: object, opts?: FunctionOptions<U>): any {
        return;
    }

}