import Class, { ClassDefinitionManager } from '../../class';
import { toSnakeCase } from '../../../../utils/format';

/**
 * Adds the property to the list of guarded keys
 * @param classInstance 
 * @param name 
 */
export const guarded = <C extends Class>(classInstance: C, name: string): any => {
    // Get key name
    const keyName = toSnakeCase(name);

    // Set definition
    const definition = ClassDefinitionManager.get(classInstance.statics());
    if(!definition.guarded.includes(keyName)) definition.guarded.push(keyName);
    ClassDefinitionManager.set(classInstance.statics(), definition);
};