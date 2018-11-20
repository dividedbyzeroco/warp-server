import Class, { ClassDefinitionManager } from '../../class';
import { toSnakeCase } from '../../../../utils/format';

/**
 * Validates the length of a string
 * @param classInstance
 * @param name
 */
export const round = (decimals: number) => <C extends Class>(classInstance: C, name: string): any => {
    // Convert key name to snake case, then add to the key map
    const keyName = toSnakeCase(name);

    // Infer data type
    const inferredType = Reflect.getMetadata('design:type', classInstance, name);
    
    // Get type from metadata
    if (!inferredType || inferredType.name.toLowerCase() !== 'number') 
        throw new Error(`Property \`${name}\` cannot be modified by \`@round()\` because it is not a number type`);

    // Get existing descriptor
    const descriptor = Object.getOwnPropertyDescriptor(classInstance, name);

    // Get definition
    const definition = ClassDefinitionManager.get(classInstance.statics());
    if (!definition.keys.includes(keyName))
        throw new Error(`Property \`${name}\` cannot be modified by \`@round()\` because it is not decorated with \`@key\``);

    // Override getter and setter
    Object.defineProperty(classInstance, name, {
        set(value) {
            // Validate value
            if(typeof value === 'number') {
                value = Number(Number(value).toFixed(decimals));
            }
            
            // Set value
            descriptor && descriptor.set && descriptor.set.apply(this, [value]);
        },
        get() {
            // Get value
            const value = descriptor && descriptor.get && descriptor.get.apply(this);

            // Return value
            return value;
        },
        enumerable: true,
        configurable: true,
    });
};