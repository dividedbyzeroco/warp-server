import { KeyManager } from '../key';
import Error from '../../../../utils/error';
import Class from '../../class';
import { RelationDefinition } from '../../relation';

export default function RelationKey<C extends typeof Class>(name: string, relationDefinition: RelationDefinition<C>): KeyManager {
    const key = new KeyManager(name, 'relation');

    key.setterDefinition = value => {
        // Get relation
        const relation = relationDefinition.toRelation();

        // Prevent secondary relations from being set
        if (relation.secondary) throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set secondary relations`);

        // If the value is a Class, set as-is
        if (value instanceof relation.class) return value;
        else if (relation.isImplementedBy(value)) return new relation.class(value.id);
        else throw new Error(Error.Code.ForbiddenOperation, `Key \`${name}\` must be a relation to \`${relation.class.className}\``);
    };

    key.getterDefinition = value => {
        // Return class value
        return value;
    };

    return key;
}