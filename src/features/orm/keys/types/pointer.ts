import { KeyManager } from '../key';
import Error from '../../../../utils/error';
import Class from '../../class';
import { PointerDefinition } from '../../pointer';

export default function PointerKey<C extends typeof Class>(name: string, pointerDefinition: PointerDefinition<C>): KeyManager {
    const key = new KeyManager(name, 'pointer');

    key.setterDefinition = value => {
        // Get pointer
        const pointer = pointerDefinition.toPointer();

        // Prevent secondary pointers from being set
        if(pointer.secondary) throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set secondary pointers`);

        // If the value is a Class, set as-is
        if(value instanceof pointer.class) return value;
        else if(pointer.isImplementedBy(value)) return new pointer.class(value.id);
        else throw new Error(Error.Code.ForbiddenOperation, `Key \`${name}\` must be a pointer to \`${pointer.class.className}\``);
    };

    key.getterDefinition = value => {
        // Return class value
        return value;
    };

    return key;
}