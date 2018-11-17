import enforce from 'enforce-js';
import Class, { ClassDefinitionManager } from './class';
import KeyMap from '../../utils/key-map';
import Error from '../../utils/error';
import { InternalKeys, Defaults } from '../../utils/constants';
import ConstraintMap, { Constraints } from '../../utils/constraint-map';
import { toDatabaseDate } from '../../utils/format';
import { QueryOptionsType } from '../../types/database';
import { getColumnsFrom, getRelationsFrom, getConstraintsFrom, getSortingFrom } from './query-mapper';

export default class Query<T extends typeof Class> {

    private classType: typeof Class;
    private selection: string[] = [];
    private included: string[] = [];
    private constraints: ConstraintMap = new ConstraintMap;
    private sorting: string[] = Defaults.Query.Sort;
    private skipped: number = Defaults.Query.Skip;
    private limitation: number = Defaults.Query.Limit;

    constructor(classType: T) {
        this.classType = classType;
    }

    /**
     * Set a key constraint
     * @param {String} key
     * @param {String} constraint
     * @param {*} value
     */
    private set(key: string, constraint: string, value: any) {
        // Enforce
        enforce`${{ key }} as a string`;

        // Check if the key exists for the class
        if (!this.class.has(key))
            throw new Error(Error.Code.ForbiddenOperation, `Constraint key \`${key}\` does not exist in \`${this.class.className}\``);

        // Convert to string if value is a date
        if (value instanceof Date) value = toDatabaseDate(value.toISOString());

        // Set the constraint
        this.constraints.set(key, constraint, value);
        return this;
    }

    get class() {
        return this.classType;
    }

    /**
     * Assert that the key is an exact match to the given value
     * @param {String} key
     * @param {*} value
     */
    public equalTo(key: string, value: any): this {
        if (typeof value === 'boolean') value = value ? 1 : 0;
        this.set(key, Constraints.EqualTo, value);
        return this;
    }

    /**
     * Assert that the key is not an exact match to the given value
     * @param {String} key
     * @param {*} value
     */
    public notEqualTo(key: string, value: any): this {
        if (typeof value === 'boolean') value = value ? 1 : 0;
        this.set(key, Constraints.NotEqualTo, value);
        return this;
    }

    /**
     * Assert that the key is greater than the given value
     * @param {String} key
     * @param {*} value
     */
    public greaterThan(key: string, value: any): this {
        this.set(key, Constraints.GreaterThan, value);
        return this;
    }

    /**
     * Assert that the key is greater than or equal to the given value
     * @param {String} key
     * @param {*} value
     */
    public greaterThanOrEqualTo(key: string, value: any): this {
        this.set(key, Constraints.GreaterThanOrEqualTo, value);
        return this;
    }

    /**
     * Assert that the key is less than the given value
     * @param {String} key
     * @param {*} value
     */
    public lessThan(key: string, value: any): this {
        this.set(key, Constraints.LessThan, value);
        return this;
    }

    /**
     * Assert that the key is less than or equal to the given value
     * @param {String} key
     * @param {*} value
     */
    public lessThanOrEqualTo(key: string, value: any): this {
        this.set(key, Constraints.LessThanOrEqualTo, value);
        return this;
    }

    /**
     * Assert that the key is not null
     * @param {String} key
     * @param {*} value
     */
    public exists(key: string): this {
        this.set(key, Constraints.Exists, true);
        return this;
    }

    /**
     * Assert that the key is null
     * @param {String} key
     * @param {*} value
     */
    public doesNotExist(key: string): this {
        this.set(key, Constraints.Exists, false);
        return this;
    }

    /**
     * Assert that the key is one of the given values
     * @param {String} key
     * @param {*} value
     */
    public containedIn(key: string, value: any[]): this {
        this.set(key, Constraints.ContainedIn, value);
        return this;
    }

    /**
     * Assert that the key is not any of the given values
     * @param {String} key
     * @param {*} value
     */
    public notContainedIn(key: string, value: any[]): this {
        this.set(key, Constraints.NotContainedIn, value);
        return this;
    }

    /**
     * Assert that the key is either one of the values or is null
     * @param {String} key
     * @param {*} value
     */
    public containedInOrDoesNotExist(key: string, value: any[]): this {
        this.set(key, Constraints.ContainedInOrDoesNotExist, value);
        return this;
    }

    /**
     * Assert that the key starts with the given string
     * @param {String} key
     * @param {*} value
     */
    public startsWith(key: string, value: string): this {
        this.set(key, Constraints.StartsWith, value);
        return this;
    }

    /**
     * Assert that the key ends with the given string
     * @param {String} key
     * @param {*} value
     */
    public endsWith(key: string, value: string): this {
        this.set(key, Constraints.EndsWith, value);
        return this;
    }

    /**
     * Assert that the key contains the given string
     * @param {String} key
     * @param {String} value
     */
    public contains(key: string | string[], value: string): this {
        if (key instanceof Array) key = key.join('|');
        this.set(key, Constraints.Contains, value);
        return this;
    }

    /**
     * Assert that the key contains either of the given strings
     * @param {String} key
     * @param {*} value
     */
    public containsEither(key: string | string[], value: string[]): this {
        if (key instanceof Array) key = key.join('|');
        this.set(key, Constraints.ContainsEither, value);
        return this;
    }

    /**
     * Assert that the key contains all of the given strings
     * @param {String} key
     * @param {*} value
     */
    public containsAll(key: string | string[], value: string[]): this {
        if (key instanceof Array) key = key.join('|');
        this.set(key, Constraints.ContainsAll, value);
        return this;
    }

    /**
     * Assert that the key matches a key in a subquery
     * @param {String} key
     * @param {String} select
     * @param {Object} value
     */
    public foundIn<C extends typeof Class>(key: string, select: string, value: Query<C>): this {
        // Set constraint
        this.set(key, Constraints.FoundIn, value.toSubquery(select));
        return this;
    }

    /**
     * Assert that the key matches a key in any of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    public foundInEither<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
        this.set(key, Constraints.FoundInEither, value.map(item => {
            const select = Object.keys(item)[0];
            const query = item[select];
            return query.toSubquery(select);
        }));
        return this;
    }

    /**
     * Assert that the key matches a key in all of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    public foundInAll<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
        this.set(key, Constraints.FoundInAll, value.map(item => {
            const select = Object.keys(item)[0];
            const query = item[select];
            return query.toSubquery(select);
        }));
        return this;
    }

    /**
     * Assert that the key does not match a key in the given subquery
     * @param {String} key
     * @param {String} select
     * @param {Object} value
     */
    public notFoundIn<C extends typeof Class>(key: string, select: string, value: Query<C>): this {
        // Set constraint
        this.set(key, Constraints.NotFoundIn, value.toSubquery(select));
        return this;
    }

    /**
     * Assert that the key does not match a key in either of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    public notFoundInEither<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
        this.set(key, Constraints.NotFoundInEither, value.map(item => {
            const select = Object.keys(item)[0];
            const query = item[select];
            return query.toSubquery(select);
        }));
        return this;
    }

    /**
     * Assert that the key does not match a key in all of the given subqueries
     * @param {String} key
     * @param {Array} value
     */
    public notFoundInAll<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
        this.set(key, Constraints.NotFoundInAll, value.map(item => {
            const select = Object.keys(item)[0];
            const query = item[select];
            return query.toSubquery(select);
        }));
        return this;
    }

    /**
     * Select specific columns to query
     * @param {String} keys
     */
    public select(key: string): this;
    public select(keys: string[]): this;
    public select(...keys: string[]): this;
    public select(...keys: any[]): this {
        // Check if first key is an array
        if (keys.length === 0) throw new Error(Error.Code.MissingConfiguration, 'Select key must be a string or an array of strings');
        const keyList: string[] = keys[0] instanceof Array ? keys[0] : keys;

        // Loop through the keys
        for (const key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if (!this.class.has(key))
                throw new Error(Error.Code.InvalidObjectKey, `Select key \`${key}\` does not exist in \`${this.class.className}\``);

            this.selection.push(key);
        }

        return this;
    }

    /**
     * Include pointer keys for the query
     * @param {String} keys
     */
    public include(key: string): this;
    public include(keys: string[]): this;
    public include(...keys: string[]): this;
    public include(...keys: any[]): this {
        // Check if first key is an array
        if (!keys) throw new Error(Error.Code.MissingConfiguration, 'Include key must be a string or an array of strings');
        const keyList: string[] = keys[0] instanceof Array ? keys[0] : keys;

        // Loop through the keys
        for (const key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if (!this.class.has(key))
                throw new Error(Error.Code.InvalidObjectKey, `Include key \`${key}\` does not exist in \`${this.class.className}\``);

            this.included.push(key);
        }
        return this;
    }

    /**
     * Sort the query by the provided keys in ascending order
     * @param {String} keys
     */
    public sortBy(...keys: any[]) {
        // Check if first key is an array
        if (!keys) throw new Error(Error.Code.MissingConfiguration, 'SortBy key must be a string or an array of strings');
        const keyList: string[] = keys[0] instanceof Array ? keys[0] : keys;

        // Loop through the keys
        for (const key of keyList) {
            enforce`${{key}} as a string`;

            // Get rawKey
            const rawKey = key[0] === '-' ? key.substr(1) : key;

            // Check if the key exists for the class
            if (!this.class.has(rawKey))
                throw new Error(Error.Code.InvalidObjectKey, `Sort key \`${key}\` does not exist in \`${this.class.className}\``);

            this.sorting.push(key);
        }
        return this;
    }

    /**
     * Sort the query by the provided keys in descending order
     * @param {String} keys
     */
    public sortByDescending(...keys: any[]) {
        // Check if first key is an array
        if (!keys) throw new Error(Error.Code.MissingConfiguration, 'SortByDescending key must be a string or an array of strings');
        const keyList: string[] = keys[0] instanceof Array ? keys[0] : keys;

        // Loop through the keys
        for (const key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if (!this.class.has(key))
                throw new Error(Error.Code.InvalidObjectKey, `Sort key \`${key}\` does not exist in \`${this.class.className}\``);

            this.sorting.push(`-${key}`);
        }
        return this;
    }

    /**
     * Number of items to skip for the query
     * @param {String} keys
     */
    public skip(value: number) {
        enforce`${{ skip: value }} as a number, greater than or equal to 0`;
        this.skipped = value;
        return this;
    }

    /**
     * Number of items to fetch, at maximum
     * @param {String} keys
     */
    public limit(value: number) {
        enforce`${{ limit: value }} as a number, greater than or equal to 0`;
        this.limitation = value;
        return this;
    }

    /**
     * Convert the query into a subquery
     * @param {String} select
     */
    public toSubquery(select: string) {
        this.selection = [];
        this.select(select);
        return this;
    }

    /**
     * Generic where clause
     * @param constraints
     */
    public where(constraints: { [key: string]: { [constraint: string]: any } }) {
        // Iterate through constraints
        for (const [ key, constraintMap ] of Object.entries(constraints)) {
            for (const [ constraint, value ] of Object.entries(constraintMap)) {
                this.set(key, constraint, value);
            }
        }
    }

    /**
     * Get selection
     */
    private getSelection() {
        // Get definition
        const definition = ClassDefinitionManager.get(this.class);

        // Get selection
        const defaultSelect = [ InternalKeys.Id, ...definition.keys, ...definition.timestamps ];
        const selected = this.selection.length > 0 ? this.selection : defaultSelect;
        const selection = [ ...selected, ...this.included ];

        return selection;
    }

    /**
     * Create class from keyMap
     * @param keys
     */
    public getClassFromKeys<C extends Class>(keys: KeyMap): C {
        // Get internal keys
        const id = keys.get(InternalKeys.Id);

        // Remove id from the key map
        keys.remove(InternalKeys.Id);

        // Return the new class
        const classInstance = (new this.class) as C;
        classInstance.identifier = id;
        classInstance.keys = keys;

        return classInstance;
    }

    /**
     * Convert query into options for database
     */
    public toQueryOptions(): QueryOptionsType {
        // Get class alias
        const className = this.class.className;

        // Get class details
        const relationsMap = ClassDefinitionManager.get(this.class).relations;

        // Get selection
        const selection = this.getSelection();

        // Get columns
        const columns = getColumnsFrom(className, selection, relationsMap);

        // Get relations
        const relations = getRelationsFrom(selection, relationsMap);

        // Get where constraints
        const constraints = getConstraintsFrom(className, this.constraints);

        // Get sorting
        const sorting = getSortingFrom(className, this.sorting);

        // Get pagination
        const { skipped, limitation } = this;

        // Return query options
        return {
            source: [this.class.source, className],
            columns,
            relations,
            constraints,
            sorting,
            skipped,
            limitation,
        };
    }

}