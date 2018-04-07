import Client from './client';
import Class, { Pointer } from '../../../classes/class';
import Error from '../../../utils/error';
import KeyMap from '../../../utils/key-map';
import { InternalKeys } from '../../../utils/constants';
import ConstraintMap, { Constraints } from '../../../utils/constraint-map';
import { toDatabaseDate } from '../../../utils/format';
import { DatabaseConfigType, FindOptionsType, IDatabaseAdapter, JoinKeyType } from '../../../types/database';
import { ConstraintObject } from '../../../types/constraints';

export default class MySQLDatabaseAdapter implements IDatabaseAdapter {

    /**
     * Private properties
     */
    _client: Client;

    /**
     * Constructor
     * @param {Object} config 
     */
    constructor(config: DatabaseConfigType) {
        // Prepare parameters
        this._client = new Client(config);
    }

    /**
     * Get current timesamp
     * @returns {String}
     */
    get currentTimestamp(): string {
        const date = new Date();
        return toDatabaseDate(date.toISOString());
    }

    async initialize() {
        // Initialize the client
        await this._client.initialize();
    }

    mapConstraint(key: string, constraint: string, value: any): string {
        // Escape key
        const escapedKey = this._client.escapeKey(key);

        // Escape definitions
        const regularEscape = value => this._client.escape(value);
        const collectionEscape = value => value.map(item => regularEscape(item)).join(', ');
        const subqueryEscape = (options: FindOptionsType) => this._generateFindClause(options);

        // List of Constraints
        const constraints = {
            [Constraints.EqualTo]: (k, v) => `${k} = ${regularEscape(v)}`,
            [Constraints.NotEqualTo]: (k, v) => `${k} <> ${regularEscape(v)}`,
            [Constraints.GreaterThan]: (k, v) => `${k} > ${regularEscape(v)}`,
            [Constraints.GreaterThanOrEqualTo]: (k, v) => `${k} >= ${regularEscape(v)}`,
            [Constraints.LessThan]: (k, v) => `${k} < ${regularEscape(v)}`,
            [Constraints.LessThanOrEqualTo]: (k, v) => `${k} <= ${regularEscape(v)}`,
            [Constraints.Exists]: (k, v) => `${k} ${v? 'IS NOT NULL' : 'IS NULL'}`,
            [Constraints.ContainedIn]: (k, v) => `${k} IN (${collectionEscape(v)})`,
            [Constraints.NotContainedIn]: (k, v) => `${k} NOT IN (${collectionEscape(v)})`,
            [Constraints.ContainedInOrDoesNotExist]: (k, v) => `(${k} IS NULL OR ${k} IN (${collectionEscape(v)}))`,
            [Constraints.StartsWith]: (k, v) => `${k} LIKE ${regularEscape(`${v}%`)}`,
            [Constraints.EndsWith]: (k, v) => `${k} LIKE ${regularEscape(`%${v}`)}`,
            [Constraints.Contains]: (k, v) => `${k} LIKE ${regularEscape(`%${v}%`)}`,
            [Constraints.ContainsEither]: (k, v) => `(${v.map(i => `${k} LIKE ${regularEscape(`%${i}%`)}`).join(' OR ')})`,
            [Constraints.ContainsAll]: (k, v) => `(${v.map(i => `${k} LIKE ${regularEscape(`%${i}%`)}`).join(' AND ')})`,
            [Constraints.FoundIn]: (k, v) => `${k} IN (${subqueryEscape(v)})`,
            [Constraints.FoundInEither]: (k, v) => `(${v.map(i => `${k} IN (${subqueryEscape(i)})`).join(' OR ')})`,
            [Constraints.FoundInAll]: (k, v) => `(${v.map(i => `${k} IN (${subqueryEscape(i)})`).join(' AND ')})`,
            [Constraints.NotFoundIn]: (k, v) => `${k} NOT IN ${subqueryEscape(v)}`,
            [Constraints.NotFoundInEither]: (k, v) => `(${v.map(i => `${k} NOT IN (${subqueryEscape(i)})`).join(' AND ')})`
        };

        // Check if constraint exists
        if(typeof constraints[constraint] !== 'undefined') {
            // Return constraint
            return constraints[constraint](escapedKey, value);
        }

        // Else, throw an error
        throw new Error(Error.Code.ForbiddenOperation, `Constraint not found: ${constraint}`);
    }

    /**
     * Generate Find Statement
     * @description Decoupled from the `find` method
     * in order to allow subquery select statements
     * @param {String} source 
     * @param {String} className 
     * @param {Array} select
     * @param {Array} joins  
     * @param {KeyMap} where
     * @param {boolean} isSubquery 
     */
    _generateFindClause({
        source,
        classAlias,
        select,
        joins,
        where
    }: FindOptionsType): string {
        // Shorten escape method name
        const escapeKey = this._client.escapeKey.bind(this._client);

        // Get from
        const from = `${escapeKey(source)} AS ${escapeKey(classAlias)}`;

        // Get joins
        const join = Object.keys(joins)
        .filter(alias => joins[alias].included)
        .map(alias => {
            const item = joins[alias];
            const joinKey = item.join.isSecondary? item.join.viaKey : `${classAlias}.${item.join.viaKey}`;
            return `LEFT OUTER JOIN ${escapeKey(item.join.class.source)} AS ${escapeKey(item.join.aliasKey)}
                ON ${escapeKey(item.join.pointerIdKey)} = ${escapeKey(joinKey)}`;
        });

        // Get columns
        let columns = select.map(key => {
            // Define source key and alias key
            let sourceKey = key;
            let aliasKey = escapeKey(key, true);

            // Check if key is a pointer id
            if(Pointer.isUsedAsIdBy(key)) {
                sourceKey = `${classAlias}${Pointer.Delimiter}${Pointer.getViaKeyFrom(key)}`;
                aliasKey = escapeKey(Pointer.getPointerIdKeyFrom(key), true);
            }
            else if(!Pointer.isUsedBy(key)) {
                // Add the classAlias to the key in order to avoid ambiguity
                sourceKey = `${classAlias}${Pointer.Delimiter}${key}`;
            }

            // Return the key
            return `${escapeKey(sourceKey)} AS ${aliasKey}`;
        });
        
        // Remove deleted rows
        where.doesNotExist(`${classAlias}${Pointer.Delimiter}${InternalKeys.Timestamps.DeletedAt}`);

        // Get constraints
        const constraints = where.toList()
        .reduce((list: ConstraintObject[], constraint) => list.concat(constraint.list), [])
        .map(({ key, constraint, value }) => this.mapConstraint(key, constraint, value));

        // Prepare clause 
        const findClause = `
            SELECT ${columns.join(', ')}
            FROM ${from} ${join.join(' ')}
            WHERE ${constraints.join(' AND ')}`;

        return findClause;
    }

    /**
     * Generate Sorting
     * @param {String} className
     * @param {Array} sort
     */
    _generateSortingClause(className: string, sort: Array<string>): string {
        // Return sorting string
        return sort.map(keySort => {
            // Add the className to the key in order to avoid ambiguity
            const sortAlias = keySort => Pointer.isUsedBy(keySort)? keySort : `${className}${Pointer.Delimiter}${keySort}`;

            // If it starts with a hyphen, sort by descending order
            // Otherwise, sort by ascending order
            if(keySort[0] === '-')
                return `${this._client.escapeKey(sortAlias(keySort.slice(1)))} DESC`;
            else 
                return `${this._client.escapeKey(sortAlias(keySort))} ASC`;
        }).join(', ');
    }

    /**
     * Map row keys into appropriate pointers
     * @param {Object} row
     */
    _mapRowKeys(row: Object, joins: { [key: string]: JoinKeyType }): KeyMap | null {
        // If row is empty, return null
        if(!row) return null;

        // Prepare key map and join map
        const keyMap = new KeyMap();
        const joinMap = {};

        // Iterate through the row's keys
        for(let key in row) {
            // If key is for a pointer
            if(Pointer.isUsedBy(key)) {
                // Prepare pointer parameters
                const value = row[key];
                const alias = Pointer.getAliasFrom(key);
                const pointerKey = Pointer.getKeyFrom(key);
                const pointer = joins[alias].join;

                // Get join keys
                const joinKeys = joinMap[alias] || {
                    [InternalKeys.Pointers.Attributes]: {}
                };
                
                // Check pointer key
                if(InternalKeys.Id === pointerKey ||
                    InternalKeys.Timestamps.CreatedAt === pointerKey ||
                    InternalKeys.Timestamps.UpdatedAt === pointerKey) {
                        joinKeys[pointerKey] = value;
                }
                else {
                    // Assign the key value to attributes
                    joinKeys[InternalKeys.Pointers.Attributes][pointerKey] = value;
                }

                // Reassign joinKeys to the join map
                joinMap[alias] = joinKeys;

                // Set the pointer value
                keyMap.set(pointer.viaKey, joinKeys);
                keyMap.setAlias(pointer.viaKey, pointer.aliasKey);
            }
            else {
                // Set the key value
                keyMap.set(key, row[key]);
            }
        }

        // Return the key map
        return keyMap;
    }

    async find(
        source: string,
        className: string,
        select: Array<string>,
        joins: { [key: string]: JoinKeyType },
        where: ConstraintMap,
        sort: Array<string>,
        skip: number,
        limit: number
    ): Promise<Array<KeyMap>> {
        // Generate find clause
        const findClause = this._generateFindClause({ source, classAlias: className, select, joins, where });
        
        // Generate sorting clause
        const sortingClause = this._generateSortingClause(className, sort);
        
        // Prepare script 
        const selectScript = `
            ${findClause}
            ORDER BY ${sortingClause}
            LIMIT ${skip}, ${limit}`;

        // Get result
        const result = await this._client.query(selectScript);

        // Map rows
        const rows: Array<KeyMap> = [];
        for(let row of result.rows) {
            const item = this._mapRowKeys(row, joins);
            if(item instanceof KeyMap) rows.push(item);
        }

        // Return result as an array of KeyMaps
        return rows;
    }

    async get(
        source: string,
        className: string,
        select: Array<string>,
        joins: { [key: string]: JoinKeyType },
        id: number
    ): Promise<KeyMap | null> {
        // Prepare where 
        let where = new ConstraintMap();
        where.doesNotExist(InternalKeys.Timestamps.DeletedAt);
        where.equalTo(InternalKeys.Id, id);

        // Generate get script
        const getScript = this._generateFindClause({ source, classAlias: className, select, joins, where });

        // Get result
        const result = await this._client.query(getScript);

        // Return result as a KeyMap
        return this._mapRowKeys(result.rows[0], joins);
    }

    async create(source: string, keys: KeyMap): Promise<number> {
        // Add timestamps
        const now = this.currentTimestamp;
        keys.set(InternalKeys.Timestamps.CreatedAt, now);
        keys.set(InternalKeys.Timestamps.UpdatedAt, now);        

        // Get sql input
        const columns: Array<string> = [];
        const values: Array<string> = [];
        const sqlInput = keys.toList().reduce((map, keyValuePair) => {
            // Push the values
            const key = this._client.escapeKey(keyValuePair.key);
            const value = this._client.escape(keyValuePair.value);
            map.columns.push(key);
            map.values.push(value);

            // Return the map
            return map;
        }, { columns, values });

        // Prepare script
        const createScript = `
            INSERT INTO ${this._client.escapeKey(source)}
            (${sqlInput.columns.join(', ')})
            VALUES
            (${sqlInput.values.join(', ')})`;

        // Create the item and get id
        const result = await this._client.query(createScript);
        
        // Return the id
        return result.id;
    }

    async update(source: string, keys: KeyMap, id: number): Promise<void> {
        // Prepare id
        const idKey = this._client.escapeKey(InternalKeys.Id);

        // Add timestamps
        const now = this.currentTimestamp;
        keys.set(InternalKeys.Timestamps.UpdatedAt, now);        

        // Get sql input
        const keyPairs: Array<string> = [];
        const sqlInput = keys.toList().reduce((map, keyValuePair) => {
            // Push the vlues
            const key = this._client.escapeKey(keyValuePair.key);
            const value = this._client.escape(keyValuePair.value);
            map.keyPairs.push(`${key} = ${value}`);

            // Return the map
            return map;
        }, { keyPairs });

        // Prepare script
        const updateScript = `
            UPDATE ${this._client.escapeKey(source)}
            SET ${sqlInput.keyPairs.join(', ')}
            WHERE ${idKey} = ${id}`;

        // Update the item
        await this._client.query(updateScript);
    }

    async destroy(source: string, keys: KeyMap, id: number): Promise<void> {
        // Prepare id, timestamps and KeyMap
        const idKey = this._client.escapeKey(InternalKeys.Id);
        const updateKey = this._client.escapeKey(InternalKeys.Timestamps.UpdatedAt);
        const deleteKey = this._client.escapeKey(InternalKeys.Timestamps.DeletedAt);

        // Add timestamps
        const now = this.currentTimestamp;
        keys.set(InternalKeys.Timestamps.UpdatedAt, now);
        keys.set(InternalKeys.Timestamps.DeletedAt, now);      

        // Prepare script
        const destroyScript = `
            UPDATE ${this._client.escapeKey(source)}
            SET ${updateKey} = ${now}, ${deleteKey} = ${now}
            WHERE ${idKey} = ${id}`;

        // Update the item
        await this._client.query(destroyScript);
    }
}