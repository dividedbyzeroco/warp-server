import Relation from './relation';
import { RelationsMap } from '../../types/relations';
import ConstraintMap, { Constraints } from '../../utils/constraint-map';
import { InternalKeys, SortDescending, SortAscending, SortSymbol, DeletedAt } from '../../utils/constants';
import CompoundKey from '../../utils/compound-key';

/**
 * Get columns
 */
export const getColumnsFrom = (className: string, keys: string[], relationsMap: RelationsMap) => {
    // Prepare columns
    const columns: Map<string, string> = new Map([]);

    // Iterate through select keys
    for (const key of keys) {

        // Check if the key is a relation
        const relationDefinition = relationsMap[key];
        if (typeof relationDefinition !== 'undefined') {
            // Get relation
            const relation = relationDefinition.toRelation();

            // Set the via and alias keys
            columns.set(relation.sourceClassKey(className), key);
            continue;
        }

        // Set source key
        const sourceKey = Relation.isUsedBy(key) ? key : Relation.formatKey(className, key);

        // Set column values
        columns.set(sourceKey, key);
    }

    return columns;
};

/**
 * Get relations
 * @param keys
 */
export const getRelationsFrom = (keys: string[], relationsMap: RelationsMap) => {
    // Prepare relations
    const relations: Map<string, Relation> = new Map([]);

    // Iterate through the selected keys
    for (const key of keys) {
        // Check if the key is a key from a relation
        if (Relation.isUsedBy(key)) {
            // Get alias
            const [ sourceClassName ] = Relation.parseKey(key);

            // If the key is from a secondary relation, add the parent relation
            const keyRelationDefinition = relationsMap[sourceClassName];
            const relation = keyRelationDefinition.toRelation();
            if (relation.secondary) {
                // Get parent relation
                const parentDefinition = relationsMap[relation.sourceClassName];
                const parentRelation = parentDefinition.toRelation();
                relations.set(relation.sourceClassName, parentRelation);
            }

            // Add relation
            relations.set(sourceClassName, relation);
            continue;
        }

        // Check if the key is a relation
        const relationDefinition = relationsMap[key];
        if (typeof relationDefinition !== 'undefined') {
            // Get relation
            const relation = relationDefinition.toRelation();

            // Add relation
            relations.set(key, relation);
            continue;
        }
    }

    return relations;
};

/**
 * Get the constraint key format of the supplied key
 * @param {String} key
 */
const getConstraintFrom = (className: string, key: string) => {
    // Check if the key is for a relation
    if (Relation.isUsedBy(key)) return key;
    else return Relation.formatKey(className, key);
};

/**
 * Determine constraints
 * @param prefix
 */
export const getConstraintsFrom = (className: string, constraints: ConstraintMap)  => {
    // Create a new instance of where
    const where = new ConstraintMap(constraints.toJSON());

    // Remove deleted rows
    where.set(DeletedAt, Constraints.Exists, false);

    // Iterate through keys
    for (const key of where.keys) {
        // Check if key is compound
        if (CompoundKey.isUsedBy(key)) {
            const keys = CompoundKey.from(key).map(k => getConstraintFrom(className, k));
            where.changeKey(key, CompoundKey.toString(keys));
        } else where.changeKey(key, getConstraintFrom(className, key));
    }

    return where;
};

/**
 * Get sorting
 */
export function getSortingFrom(className: string, sort: string[]) {
    // Prepare sorting
    const sorting: string[] = [];

    // Iterate through each sort
    for (const sortKey of sort) {
        // Order
        const order = sortKey[0] === SortSymbol ? SortDescending : SortAscending;
        let key = order === SortDescending ? sortKey.slice(1) : sortKey;

        // Add className to sort key if it is not a relation
        if (!Relation.isUsedBy(key))
            key = `${order === SortDescending ? SortSymbol : ''}${Relation.formatKey(className, key)}`;

        // Push the key
        sorting.push(key);
    }

    return sorting;
}