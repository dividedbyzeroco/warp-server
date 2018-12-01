import Class, { ClassDefinitionManager } from '../../class';
import { toSnakeCase } from '../../../../utils/format';
import Error from '../../../../utils/error';

/**
 * Adds the property to the list of computed keys
 * @param classInstance
 * @param name
 */
export const computed = <C extends Class>(classInstance: C, name: string): any => {
    // Get key name
    const keyName = toSnakeCase(name);

    // Set definition
    const definition = ClassDefinitionManager.get(classInstance.statics());
    if (!definition.computed.includes(keyName)) definition.computed.push(keyName);
    ClassDefinitionManager.set(classInstance.statics(), definition);

    // Get existing descriptor
    const descriptor = Object.getOwnPropertyDescriptor(classInstance, name);

    // Extend getter and setter
    Object.defineProperty(classInstance, name, {
        set(value) {
            // Prevent setting data
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${keyName}\` cannot be set because it is a \`computed\` key`);
        },
        get() {
            // If descriptor is defined
            if (descriptor && typeof descriptor.get === 'function') {
                // Get formatted value
                return descriptor.get.apply(this);
            } else throw new Error(Error.Code.MissingConfiguration, `Key \`${keyName}\` is a \`computed\` key but does not have a defined getter`);
        },
        enumerable: true,
        configurable: true,
    });
};