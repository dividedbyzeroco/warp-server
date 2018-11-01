import Class from '../../class';
import { toSnakeCase } from '../../../../utils/format';
import Error from '../../../../utils/error';

/**
 * Adds the property to the list of protected keys
 * @param classInstance 
 * @param name 
 */
export const Protected = <C extends Class>(classInstance: C, name: string): any => {
    // Get key name
    const keyName = toSnakeCase(name);

    // Get descriptor
    const descriptor = Object.getOwnPropertyDescriptor(classInstance, name);

    return {
        set(value) {
            throw new Error(Error.Code.ForbiddenOperation, `You cannot manually set the value of protected key '${keyName}'`);
        },
        get() {
            return descriptor && descriptor.get && descriptor.get() || this._keys.get(name);
        },
        enumerable: true,
        configurable: true
    };
};