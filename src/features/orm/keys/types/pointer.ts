import { KeyManager } from '../key';
import Error from '../../../../utils/error';
import Class from '../../class';
import { PointerDefinition } from '../../pointer';

export default function PointerKey<C extends typeof Class>(name: string, pointerDefinition: PointerDefinition<C>): KeyManager {
    const key = new KeyManager(name, 'pointer');

    key.setterDefinition = value => {
        // Get pointer
        const pointer = pointerDefinition.toPointer();

        // Check pointer type
        if(pointer.isSecondary)
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set secondary pointers`);
        if(!(value instanceof pointer.class) && !pointer.isImplementedBy(value))
            throw new Error(Error.Code.ForbiddenOperation, `Key \`${pointer.aliasKey}\` must be a pointer to \`${pointer.class.className}\``);
        if(value && (typeof value.id === 'undefined' || value.id === null))
            throw new Error(Error.Code.MissingConfiguration, `Value for '${name}' is missing an 'id'`);
        
        // Store only the id
        return value.id;
    };

    key.getterDefinition = value => {
        // Get pointer
        const pointer = pointerDefinition.toPointer();
        const classType = pointer.class;

        // If value is null, return null
        if(value === null) return null;
        if(typeof value === 'object' && value.id === null) return null;

        // Get the class instance
        const classInstance = new classType(value);
        classInstance.toPointer();

        // Return class intance
        return classInstance;
    };

    return key;
}