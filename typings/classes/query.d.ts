import Class from './class';
import ConstraintMap from '../utils/constraint-map';
import KeyMap from '../utils/key-map';
export default class Query<T extends typeof Class> {
    _class: typeof Class;
    _select: Array<string>;
    _include: Array<string>;
    _where: ConstraintMap;
    _sort: Array<string>;
    _skip: number;
    _limit: number;
    _isSubquery: boolean;
    constructor(classType: T);
    /**
     * Set a key constraint
     * @param {String} key
     * @param {String} constraint
     * @param {*} value
     */
    private set;
    readonly SubqueryPrefix: string;
    readonly class: typeof Class;
    /**
     * Assert that the key is an exact match to the given value
     * @param {String} key
     * @param {*} value
     */
    equalTo(key: string, value: any): this;
    /**
     * Assert that the key is not an exact match to the given value
     * @param {String} key
     * @param {*} value
     */
    notEqualTo(key: string, value: any): this;
    /**
     * Assert that the key is greater than the given value
     * @param {String} key
     * @param {*} value
     */
    greaterThan(key: string, value: any): this;
    /**
     * Assert that the key is greater than or equal to the given value
     * @param {String} key
     * @param {*} value
     */
    greaterThanOrEqualTo(key: string, value: any): this;
    /**
     * Assert that the key is less than the given value
     * @param {String} key
     * @param {*} value
     */
    lessThan(key: string, value: any): this;
    /**
     * Assert that the key is less than or equal to the given value
     * @param {String} key
     * @param {*} value
     */
    lessThanOrEqualTo(key: string, value: any): this;
    /**
     * Assert that the key is not null
     * @param {String} key
     * @param {*} value
     */
    exists(key: string): this;
    /**
     * Assert that the key is null
     * @param {String} key
     * @param {*} value
     */
    doesNotExist(key: string): this;
    /**
     * Assert that the key is one of the given values
     * @param {String} key
     * @param {*} value
     */
    containedIn(key: string, value: Array<any>): this;
    /**
     * Assert that the key is not any of the given values
     * @param {String} key
     * @param {*} value
     */
    notContainedIn(key: string, value: Array<any>): this;
    /**
     * Assert that the key is either one of the values or is null
     * @param {String} key
     * @param {*} value
     */
    containedInOrDoesNotExist(key: string, value: Array<any>): this;
    /**
     * Assert that the key starts with the given string
     * @param {String} key
     * @param {*} value
     */
    startsWith(key: string, value: string): this;
    /**
     * Assert that the key ends with the given string
     * @param {String} key
     * @param {*} value
     */
    endsWith(key: string, value: string): this;
    /**
     * Assert that the key contains the given string
     * @param {String} key
     * @param {String} value
     */
    contains(key: string | string[], value: string): this;
    /**
     * Assert that the key contains either of the given strings
     * @param {String} key
     * @param {*} value
     */
    containsEither(key: string | string[], value: Array<string>): this;
    /**
     * Assert that the key contains all of the given strings
     * @param {String} key
     * @param {*} value
     */
    containsAll(key: string | string[], value: Array<string>): this;
    /**
     * Assert that the key matches a key in a subquery
     * @param {String} key
     * @param {String} select
     * @param {Object} value
     */
    foundIn<U extends typeof Class>(key: string, select: string, value: Query<U>): this;
    /**
     * Assert that the key matches a key in any of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    foundInEither<U extends typeof Class>(key: string, value: Array<{
        [keyMatch: string]: Query<U>;
    }>): this;
    /**
     * Assert that the key matches a key in all of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    foundInAll<U extends typeof Class>(key: string, value: Array<{
        [keyMatch: string]: Query<U>;
    }>): this;
    /**
     * Assert that the key does not match a key in the given subquery
     * @param {String} key
     * @param {String} select
     * @param {Object} value
     */
    notFoundIn<U extends typeof Class>(key: string, select: string, value: Query<U>): this;
    /**
     * Assert that the key does not match a key in all of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    notFoundInEither<U extends typeof Class>(key: string, value: Array<{
        [keyMatch: string]: Query<U>;
    }>): this;
    /**
     * Select specific columns to query
     * @param {String} keys
     */
    select(...keys: Array<any>): this;
    /**
     * Include pointer keys for the query
     * @param {String} keys
     */
    include(...keys: Array<any>): this;
    /**
     * Sort the query by the provided keys in ascending order
     * @param {String} keys
     */
    sortBy(...keys: Array<any>): this;
    /**
     * Sort the query by the provided keys in descending order
     * @param {String} keys
     */
    sortByDescending(...keys: Array<any>): this;
    /**
     * Number of items to skip for the query
     * @param {String} keys
     */
    skip(value: number): this;
    /**
     * Number of items to fetch, at maximum
     * @param {String} keys
     */
    limit(value: number): this;
    /**
     * Convert the query into a subquery
     * @param {String} select
     */
    toSubquery(select: string): this;
    private getKeys;
    private getConstraints;
    private getSorting;
    getClassFromKeyMap<T extends Class>(keys: KeyMap): T;
    toQueryOptions(): {
        source: string;
        classAlias: string;
        select: string[];
        joins: {};
        where: ConstraintMap;
        sorting: string[];
        skip: number;
        limit: number;
    };
}
