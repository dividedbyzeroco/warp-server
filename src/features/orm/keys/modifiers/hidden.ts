import Class from '../../class';
import { toSnakeCase } from '../../../../utils/format';

/**
 * Adds the property to the list of hidden keys
 * @param classInstance 
 * @param name 
 */
export const Hidden = <C extends Class>(classInstance: C, name: string) => {
    // Get key name
    const keyName = toSnakeCase(name);

    // Set definition
    const definition = classInstance.getDefinition();
    if(!definition.hidden.includes(keyName)) definition.hidden.push(keyName);
    classInstance.setDefinition(definition);
};