import Client from './client';
import Error from '../../../utils/error';
import KeyMap from '../../../utils/key-map';
import { InternalKeys, DatabaseWrite, DatabaseRead, SortSymbol } from '../../../utils/constants';
import ConstraintMap, { Constraints } from '../../../utils/constraint-map';
import { toDatabaseDate } from '../../../utils/format';
import CompoundKey from '../../../utils/compound-key';
import { FindClauseOptionsType, IDatabaseAdapter, DatabaseConfig } from '../../../types/database';
import { ConstraintObject } from '../../../types/constraints';
import Pointer from '../../../features/orm/pointer';
import Query from '../../../features/orm/query';
import Class from '../../../features/orm/class';
import { Increment, JsonAction } from '../../../features/orm/specials';

const { version } = require('../../../package.json');

export default class MySQLDatabaseAdapter implements IDatabaseAdapter {

    /**
     * Private properties
     */
    private client: Client;
    private constraints = {
        [Constraints.EqualTo]: (k, v) => `${k} = ${this.regularEscape(v)}`,
        [Constraints.NotEqualTo]: (k, v) => `${k} <> ${this.regularEscape(v)}`,
        [Constraints.GreaterThan]: (k, v) => `${k} > ${this.regularEscape(v)}`,
        [Constraints.GreaterThanOrEqualTo]: (k, v) => `${k} >= ${this.regularEscape(v)}`,
        [Constraints.LessThan]: (k, v) => `${k} < ${this.regularEscape(v)}`,
        [Constraints.LessThanOrEqualTo]: (k, v) => `${k} <= ${this.regularEscape(v)}`,
        [Constraints.Exists]: (k, v) => `${k} ${v? 'IS NOT NULL' : 'IS NULL'}`,
        [Constraints.ContainedIn]: (k, v) => `${k} IN (${this.collectionEscape(v)})`,
        [Constraints.NotContainedIn]: (k, v) => `${k} NOT IN (${this.collectionEscape(v)})`,
        [Constraints.ContainedInOrDoesNotExist]: (k, v) => `(${k} IS NULL OR ${k} IN (${this.collectionEscape(v)}))`,
        [Constraints.StartsWith]: (k, v) => `${k} LIKE ${this.regularEscape(`${v}%`)}`,
        [Constraints.EndsWith]: (k, v) => `${k} LIKE ${this.regularEscape(`%${v}`)}`,
        [Constraints.Contains]: (k, v) => `${k} LIKE ${this.regularEscape(`%${v}%`)}`,
        [Constraints.ContainsEither]: (k, v) => `(${v.map(i => `${k} LIKE ${this.regularEscape(`%${i}%`)}`).join(' OR ')})`,
        [Constraints.ContainsAll]: (k, v) => `(${v.map(i => `${k} LIKE ${this.regularEscape(`%${i}%`)}`).join(' AND ')})`,
        [Constraints.FoundIn]: (k, v) => `${k} IN (${this.subqueryEscape(v)})`,
        [Constraints.FoundInEither]: (k, v) => `(${v.map(i => `${k} IN (${this.subqueryEscape(i)})`).join(' OR ')})`,
        [Constraints.FoundInAll]: (k, v) => `(${v.map(i => `${k} IN (${this.subqueryEscape(i)})`).join(' AND ')})`,
        [Constraints.NotFoundIn]: (k, v) => `${k} NOT IN (${this.subqueryEscape(v)})`,
        [Constraints.NotFoundInEither]: (k, v) => `(${v.map(i => `${k} NOT IN (${this.subqueryEscape(i)})`).join(' AND ')})`
    };

    /**
     * Constructor
     * @param {Object} config 
     */
    constructor(config: DatabaseConfig) {
        // Prepare parameters
        this.client = new Client(config);
    }

    /**
     * Get current timesamp
     * @returns {String}
     */
    get currentTimestamp(): string {
        return toDatabaseDate(new Date().toISOString());
    }

    async initialize() {
        // Initialize the client
        await this.client.initialize();
    }

    private escapeKey(key: string, useRaw: boolean = false) {
        return CompoundKey.isUsedBy(key) ? 
            // If key is a compound key, use concat
            `CONCAT(${CompoundKey.from(key).map(k => this.client.escapeKey(k))})`
            // Else, do a simple escape
            : this.client.escapeKey(key, useRaw);
    }

    private regularEscape = (value: any) => {
        // Set escape methods for special types
        if(value instanceof Increment) {
            value.escapeKey = this.client.escapeKey;
            value.escape = this.client.escape;
        }
        if(value instanceof JsonAction) {
            value.escapeKey = this.client.escapeKey;
            value.escape = this.client.escape;
        }

        // Return escaped value
        return this.client.escape(value);
    }

    private collectionEscape = (value: any) => {
        return value.map(item => this.regularEscape(item)).join(', ');
    }

    private subqueryEscape = <T extends typeof Class>(query: Query<T>) => {
        // Get query keys
        const { source, columns, relations, constraints } = query.toQueryOptions();
        return this.getFindClause({ source, columns, relations, constraints });
    }

    private parseConstraint(key: string, constraint: string, value: any): string {
        // Escape key
        const escapedKey = this.escapeKey(key);

        // Check if constraint exists
        if(typeof this.constraints[constraint] !== 'undefined') {
            // Return constraint
            return this.constraints[constraint](escapedKey, value);
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
     * @param {Array} relations  
     * @param {KeyMap} where
     * @param {boolean} isSubquery 
     */
    private getFindClause({
        source,
        columns,
        relations,
        constraints
    }: FindClauseOptionsType): string {
        // Get select
        const select: string[] = [];
        for(const [key, alias] of columns.entries())
            select.push(`${this.escapeKey(key)} AS ${this.escapeKey(alias, true)}`);

        // Get from
        const from = `${this.escapeKey(source[0])} AS ${this.escapeKey(source[1])}`;

        // Get joins
        const joins: string[] = [];
        for(const [alias, pointer] of relations.entries())
            joins.push(`LEFT OUTER JOIN ${this.escapeKey(pointer.class.source)} AS ${this.escapeKey(alias, true)}`
                + ` ON ${this.escapeKey(pointer.parentClassKey())} = ${this.escapeKey(pointer.sourceClassKey(source[1]))}`);

        // Get where
        const where = constraints.toArray()
            .reduce<ConstraintObject[]>((list, keyConstraints) => [ ...list, ...keyConstraints.constraints ], [])
            .map(({ key, constraint, value }) => this.parseConstraint(key, constraint, value));

        // Prepare clause 
        const findClause = `SELECT ${select.join(', ')} FROM ${from} ${joins.join('\n')} WHERE ${where.join(' AND ')}`;

        return findClause;
    }

    /**
     * Generate Sorting
     * @param {String} className
     * @param {Array} sort
     */
    private getSortClause(className: string, sort: Array<string>): string {
        // Return sorting string
        return sort.map(keySort => {
            // If it starts with a hyphen, sort by descending order
            // Otherwise, sort by ascending order
            if(keySort[0] === SortSymbol)
                return `${this.escapeKey(keySort.slice(1))} DESC`;
            else
                return `${this.escapeKey(keySort)} ASC`;
        }).join(', ');
    }

    /**
     * Map row keys into appropriate pointers
     * @param {Object} row
     */
    private mapRows(row: Object): KeyMap {
        // Prepare key map
        const keys = new KeyMap;

        // Iterate through the row's keys
        for(const [ key, value ] of Object.entries(row)) {
            // If key is for a pointer
            if(Pointer.isUsedBy(key)) {
                // Prepare relation parameters
                const [ pointerName, pointerKey ] = Pointer.parseKey(key);

                // Assign pointer
                const pointer = { ...keys.get(pointerName), [pointerKey]: value };

                // Set key to the latest value
                keys.set(pointerName, pointer);
            }
            else {
                // Set the key value
                keys.set(key, row[key]);
            }
        }

        // Return the key map
        return keys;
    }

    async find(
        source: [string, string],
        columns: Map<string, string>,
        relations: Map<string, Pointer>,
        constraints: ConstraintMap,
        sorting: Array<string>,
        skipped: number,
        limitation: number
    ): Promise<Array<KeyMap>> {
        // Generate find clause
        const findClause = this.getFindClause({ source, columns, relations, constraints });
        
        // Generate sorting clause
        const sortingClause = this.getSortClause(source[1], sorting);
        
        // Prepare script 
        const selectScript = `${findClause} ORDER BY ${sortingClause} LIMIT ${skipped}, ${limitation}; -- Warp Server ${version}`;

        // Get result
        const result = await this.client.query(selectScript, DatabaseRead);

        // Map rows
        const rows: Array<KeyMap> = [];
        for(let row of result.rows) {
            const item = this.mapRows(row);
            rows.push(item);
        }

        // Return result as an array of KeyMaps
        return rows;
    }

    async create(source: string, keys: KeyMap): Promise<number> {
        // Add timestamps
        const now = this.currentTimestamp;
        keys.set(InternalKeys.Timestamps.CreatedAt, now);
        keys.set(InternalKeys.Timestamps.UpdatedAt, now);        

        // Prepare script
        const createScript = `INSERT INTO ${this.client.escapeKey(source)} (${keys.keys.join(', ')}) VALUES (${keys.values.join(', ')}); -- Warp Server ${version}`;

        // Create the item and get id
        const result = await this.client.query(createScript, DatabaseWrite);
        
        // Return the id
        return result.id;
    }

    async update(source: string, keys: KeyMap, id: number): Promise<void> {
        // Prepare id
        const idKey = this.client.escapeKey(InternalKeys.Id);

        // Add timestamps
        const now = this.currentTimestamp;
        keys.set(InternalKeys.Timestamps.UpdatedAt, now);        

        // Get sql input
        const sqlInput = keys.toArray().reduce((input, [ key, value ]) => ([
            ...input,
            `${this.client.escapeKey(key)} = ${this.client.escape(value)}`
        ]), []);

        // Prepare script
        const updateScript = `UPDATE ${this.client.escapeKey(source)} SET ${sqlInput.join(', ')} WHERE ${idKey} = ${id}; -- Warp Server ${version}`;

        // Update the item
        await this.client.query(updateScript, DatabaseWrite);
    }

    async destroy(source: string, keys: KeyMap, id: number): Promise<void> {
        // Prepare id, timestamps and KeyMap
        const idKey = this.client.escapeKey(InternalKeys.Id);

        // Add timestamps
        const now = this.currentTimestamp;
        keys.set(InternalKeys.Timestamps.UpdatedAt, now);
        keys.set(InternalKeys.Timestamps.DeletedAt, now);

        // Get sql input
        const sqlInput = keys.toArray().reduce((input, [ key, value ]) => ([
            ...input,
            `${this.client.escapeKey(key)} = ${this.client.escape(value)}`
        ]), []);

        // Prepare script
        const destroyScript = `UPDATE ${this.client.escapeKey(source)} SET ${sqlInput.join(', ')} WHERE ${idKey} = ${id}; -- Warp Server ${version}`;

        // Update the item
        await this.client.query(destroyScript, DatabaseWrite);
    }
}