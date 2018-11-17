import Class, { ClassDefinitionManager } from '../../class';
import { toSnakeCase } from '../../../../utils/format';

/**
 * Adds the property to the list of hidden keys
 * @param classInstance 
 * @param name 
 */
export const hidden = <C extends Class>(classInstance: C, name: string) => {
    // Get key name
    const keyName = toSnakeCase(name);

    // Set definition
    const definition = ClassDefinitionManager.get(classInstance.statics());
    if(!definition.hidden.includes(keyName)) definition.hidden.push(keyName);
    ClassDefinitionManager.set(classInstance.statics(), definition);
};