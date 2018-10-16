import Client from './client';
import KeyMap from '../../../utils/key-map';
import ConstraintMap from '../../../utils/constraint-map';
import { DatabaseConfigType, FindOptionsType, IDatabaseAdapter, JoinKeyType } from '../../../types/database';
export default class MySQLDatabaseAdapter implements IDatabaseAdapter {
    /**
     * Private properties
     */
    _client: Client;
    /**
     * Constructor
     * @param {Object} config
     */
    constructor(config: DatabaseConfigType);
    /**
     * Get current timesamp
     * @returns {String}
     */
    readonly currentTimestamp: string;
    initialize(): Promise<void>;
    mapConstraint(key: string, constraint: string, value: any): string;
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
    _generateFindClause({ source, classAlias, select, joins, where }: FindOptionsType): string;
    /**
     * Generate Sorting
     * @param {String} className
     * @param {Array} sort
     */
    _generateSortingClause(className: string, sort: Array<string>): string;
    /**
     * Map row keys into appropriate pointers
     * @param {Object} row
     */
    _mapRowKeys(row: Object, joins: {
        [key: string]: JoinKeyType;
    }): KeyMap | null;
    find(source: string, className: string, select: Array<string>, joins: {
        [key: string]: JoinKeyType;
    }, where: ConstraintMap, sort: Array<string>, skip: number, limit: number): Promise<Array<KeyMap>>;
    get(source: string, className: string, select: Array<string>, joins: {
        [key: string]: JoinKeyType;
    }, where: ConstraintMap, id: number): Promise<KeyMap | null>;
    create(source: string, keys: KeyMap): Promise<number>;
    update(source: string, keys: KeyMap, id: number): Promise<void>;
    destroy(source: string, keys: KeyMap, id: number): Promise<void>;
}
