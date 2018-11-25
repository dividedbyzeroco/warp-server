import Class, { ClassDefinitionManager } from '../../class';
import { toSnakeCase } from '../../../../utils/format';

/**
 * Validates the length of a string
 * @param classInstance
 * @param name
 */
export const enumerated = (values: any[] | Map<any, any>) => <C extends Class>(classInstance: C, name: string): any => {
    // Convert key name to snake case, then add to the key map
    const keyName = toSnakeCase(name);

    // Get existing descriptor
    const descriptor = Object.getOwnPropertyDescriptor(classInstance, name);

    // Get definition
    const definition = ClassDefinitionManager.get(classInstance.statics());
    if (!definition.keys.includes(keyName))
        throw new Error(`Property \`${name}\` cannot be modified by \`@enum()\` because it is not decorated with \`@key\``);

    // Override getter and setter
    Object.defineProperty(classInstance, name, {
        set(value) {
            // Validate value
            if (values instanceof Array) {
                if (!values.includes(value))
                    throw new Error(`Key \`${keyName}\` can only be set to either of the following values: ${values.join(', ')}`);
            } else if (!values.has(value))
                throw new Error(`Key \`${keyName}\` can only be set to either of the following values: ${[...values.keys()].join(', ')}`);

            // Set value
            descriptor && descriptor.set && descriptor.set.apply(this, [value]);
        },
        get() {
            // Get value
            let value = descriptor && descriptor.get && descriptor.get.apply(this) || undefined;

            // Translate value
            if (values instanceof Map) {
                value = values.get(value);
            }

            // Return value
            return value;
        },
        enumerable: true,
        configurable: true,
    });
};