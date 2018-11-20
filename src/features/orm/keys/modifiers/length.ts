import Class, { ClassDefinitionManager } from '../../class';
import { toSnakeCase } from '../../../../utils/format';

/**
 * Validates the length of a string
 * @param classInstance
 * @param name
 */
export const length = (min: number, max?: number) => <C extends Class>(classInstance: C, name: string): any => {
    // Convert key name to snake case, then add to the key map
    const keyName = toSnakeCase(name);

    // Infer data type
    const inferredType = Reflect.getMetadata('design:type', classInstance, name);
    
    // Get type from metadata
    if (!inferredType || inferredType.name.toLowerCase() !== 'string') 
        throw new Error(`Property \`${name}\` cannot be modified by \`@length()\` because it is not a string type`);

    // Get existing descriptor
    const descriptor = Object.getOwnPropertyDescriptor(classInstance, name);

    // Get definition
    const definition = ClassDefinitionManager.get(classInstance.statics());
    if (!definition.keys.includes(keyName))
        throw new Error(`Property \`${name}\` cannot be modified by \`@length()\` because it is not decorated with \`@key\``);

    // Override getter and setter
    Object.defineProperty(classInstance, name, {
        set(value) {
            // Validate value
            if(value.length < min)
                throw new Error(`Key \`${keyName}\` must be at least \`${min}\` characters`);
            else if(typeof max !== 'undefined' && value.length > max)
                throw new Error(`Key \`${keyName}\` can only have up to \`${max}\` characters`);

            // Set value
            descriptor && descriptor.set && descriptor.set.apply(this, [value]);
        },
        get() {
            // Get value
            const value = descriptor && descriptor.get && descriptor.get.apply(this) || undefined;

            // Return value
            return value;
        },
        enumerable: true,
        configurable: true,
    });
};