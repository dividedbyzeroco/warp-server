import enforce from 'enforce-js';
import Class from './class';
import Pointer from './pointer';
import ConstraintMap, { Constraints } from '../utils/constraint-map';
import { toDatabaseDate } from '../utils/format';
import Error from '../utils/error';
import { InternalKeys, Defaults } from '../utils/constants';
import KeyMap from '../utils/key-map';
import CompoundKey from '../utils/compound-key';

export default class Query<T extends typeof Class> {

    _class: typeof Class;
    _select: Array<string> = [];
    _include: Array<string> = [];
    _where: ConstraintMap = new ConstraintMap();
    _sort: Array<string> = Defaults.Query.Sort;
    _skip: number = Defaults.Query.Skip;
    _limit: number = Defaults.Query.Limit;
    _isSubquery: boolean = false;

    constructor(classType: T) {
        this._class = classType;
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
        if(!this.class.has(key))
            throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

        // Convert to string if value is a date
        if(value instanceof Date) value = toDatabaseDate(value.toISOString());

        // Set the constraint
        this._where.set(key, constraint, value);
        return this;
    }

    get SubqueryPrefix() {
        return 'subquery_';
    }

    get class() {
        return this._class;
    }

    /**
     * Assert that the key is an exact match to the given value
     * @param {String} key 
     * @param {*} value 
     */
    equalTo(key: string, value: any): this {
        if(typeof value === 'boolean') value = value ? 1 : 0;
        this.set(key, Constraints.EqualTo, value);
        return this;
    }

    /**
     * Assert that the key is not an exact match to the given value
     * @param {String} key 
     * @param {*} value 
     */
    notEqualTo(key: string, value: any): this {
        if(typeof value === 'boolean') value = value ? 1 : 0;
        this.set(key, Constraints.NotEqualTo, value);
        return this;
    }

    /**
     * Assert that the key is greater than the given value
     * @param {String} key 
     * @param {*} value 
     */
    greaterThan(key: string, value: any): this {
        this.set(key, Constraints.GreaterThan, value);
        return this;
    }

    /**
     * Assert that the key is greater than or equal to the given value
     * @param {String} key 
     * @param {*} value 
     */
    greaterThanOrEqualTo(key: string, value: any): this {
        this.set(key, Constraints.GreaterThanOrEqualTo, value);
        return this;
    }

    /**
     * Assert that the key is less than the given value
     * @param {String} key 
     * @param {*} value 
     */
    lessThan(key: string, value: any): this {
        this.set(key, Constraints.LessThan, value);
        return this;
    }

    /**
     * Assert that the key is less than or equal to the given value
     * @param {String} key 
     * @param {*} value 
     */
    lessThanOrEqualTo(key: string, value: any): this {
        this.set(key, Constraints.LessThanOrEqualTo, value);
        return this;
    }

    /**
     * Assert that the key is not null
     * @param {String} key 
     * @param {*} value 
     */
    exists(key: string): this {
        this.set(key, Constraints.Exists, true);
        return this;
    }

    /**
     * Assert that the key is null
     * @param {String} key 
     * @param {*} value 
     */
    doesNotExist(key: string): this {
        this.set(key, Constraints.Exists, false);
        return this;
    }

    /**
     * Assert that the key is one of the given values
     * @param {String} key 
     * @param {*} value 
     */
    containedIn(key: string, value: Array<any>): this {
        this.set(key, Constraints.ContainedIn, value);
        return this;
    }

    /**
     * Assert that the key is not any of the given values
     * @param {String} key 
     * @param {*} value 
     */
    notContainedIn(key: string, value: Array<any>): this {
        this.set(key, Constraints.NotContainedIn, value);
        return this;
    }

    /**
     * Assert that the key is either one of the values or is null
     * @param {String} key 
     * @param {*} value 
     */
    containedInOrDoesNotExist(key: string, value: Array<any>): this {
        this.set(key, Constraints.ContainedInOrDoesNotExist, value);
        return this;
    }

    /**
     * Assert that the key starts with the given string
     * @param {String} key 
     * @param {*} value 
     */
    startsWith(key: string, value: string): this {
        this.set(key, Constraints.StartsWith, value);
        return this;
    }

    /**
     * Assert that the key ends with the given string
     * @param {String} key 
     * @param {*} value 
     */
    endsWith(key: string, value: string): this {
        this.set(key, Constraints.EndsWith, value);
        return this;
    }

    /**
     * Assert that the key contains the given string
     * @param {String} key 
     * @param {String} value 
     */
    contains(key: string | string[], value: string): this {
        if(key instanceof Array) key = key.join('|');
        this.set(key, Constraints.Contains, value);
        return this;
    }

    /**
     * Assert that the key contains either of the given strings
     * @param {String} key 
     * @param {*} value 
     */
    containsEither(key: string | string[], value: Array<string>): this {
        if(key instanceof Array) key = key.join('|');
        this.set(key, Constraints.ContainsEither, value);
        return this;
    }

    /**
     * Assert that the key contains all of the given strings
     * @param {String} key 
     * @param {*} value 
     */
    containsAll(key: string | string[], value: Array<string>): this {
        if(key instanceof Array) key = key.join('|');
        this.set(key, Constraints.ContainsAll, value);
        return this;
    }

    /**
     * Assert that the key matches a key in a subquery
     * @param {String} key 
     * @param {String} select 
     * @param {Object} value 
     */
    foundIn<U extends typeof Class>(key: string, select: string, value: Query<U>): this {
        // Set constraint
        this.set(key, Constraints.FoundIn, value.toSubquery(select));
        return this;
    }

    /**
     * Assert that the key matches a key in any of the given subqueries
     * @param {String} key
     * @param {Array} value 
     */
    foundInEither<U extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<U>}>): this {
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
    foundInAll<U extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<U>}>): this {
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
    notFoundIn<U extends typeof Class>(key: string, select: string, value: Query<U>): this {
        // Set constraint
        this.set(key, Constraints.NotFoundIn, value.toSubquery(select));
        return this;
    }

    /**
     * Assert that the key does not match a key in all of the given subqueries
     * @param {String} key
     * @param {Array} value 
     */
    notFoundInEither<U extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<U>}>): this {
        this.set(key, Constraints.NotFoundInEither, value.map(item => {
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
    select(...keys: Array<any>): this {
        // Check if first key is an array
        if(!keys) throw new Error(Error.Code.MissingConfiguration, 'Select key must be a string or an array of strings');
        const keyList: Array<string> = keys[0] instanceof Array? keys[0] : keys;

        // Loop through the keys
        for(let key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this._select.push(key);
        }

        return this;
    }

    /**
     * Include pointer keys for the query
     * @param {String} keys
     */
    include(...keys: Array<any>): this {
        // Check if first key is an array
        if(!keys) throw new Error(Error.Code.MissingConfiguration, 'Include key must be a string or an array of strings');
        const keyList: Array<string> = keys[0] instanceof Array? keys[0] : keys;

        // Loop through the keys
        for(let key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this._include.push(key);
        }
        return this;
    }

    /**
     * Sort the query by the provided keys in ascending order
     * @param {String} keys
     */
    sortBy(...keys: Array<any>) {
        // Check if first key is an array
        if(!keys) throw new Error(Error.Code.MissingConfiguration, 'SortBy key must be a string or an array of strings');
        const keyList: Array<string> = keys[0] instanceof Array? keys[0] : keys;

        // Loop through the keys
        for(let key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this._sort.push(key);
        }
        return this;
    }

    /**
     * Sort the query by the provided keys in descending order
     * @param {String} keys
     */
    sortByDescending(...keys: Array<any>) {
        // Check if first key is an array
        if(!keys) throw new Error(Error.Code.MissingConfiguration, 'SortByDescending key must be a string or an array of strings');
        const keyList: Array<string> = keys[0] instanceof Array? keys[0] : keys;

        // Loop through the keys
        for(let key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this._sort.push(`-${key}`);
        }
        return this;
    }

    /**
     * Number of items to skip for the query
     * @param {String} keys
     */
    skip(value: number) {
        enforce`${{ skip: value }} as a number`;
        this._skip = value;
        return this;
    }

    /**
     * Number of items to fetch, at maximum
     * @param {String} keys
     */
    limit(value: number) {
        enforce`${{ limit: value }} as a number`;
        this._limit = value;
        return this;
    }

    /**
     * Convert the query into a subquery
     * @param {String} select 
     */
    toSubquery(select: string) {
        this._select = [];
        this.select(select);
        this._isSubquery = true;
        return this;
    }

    private getKeys() {
        // Get metadata
        const metadata = this.class.prototype.getMetadata();

        // Prepare selection keys
        let select = this._select;
        let include = this._include;

        // Get parameters
        const keys: Array<string> = [];
        const includedJoins = {};

        // If select is empty, use the default keys
        if(select.length === 0) {
            select = [InternalKeys.Id, ...Object.keys(metadata.keys), ...Object.keys(metadata.timestamps)];
        }

        // Iterate through the selected keys
        for(let key of select) {
            // If the key is an internal key
            if(key === InternalKeys.Id || metadata.timestamps[key]) {
                // Push the key
                keys.push(key);
            }
            // If it is a pointer key (uses '.')
            else if(Pointer.isUsedBy(key)) {
                // Move it to the include list
                include.push(key);
            }
            // If it is a regular key and it exists
            else if(typeof metadata.keys[key] !== 'undefined') {
                // Get key name
                const keyName = metadata.keys[key];
                
                // If they key provided is a pointer (foreign key without '.')
                if(keyName instanceof Pointer) {
                    // If the pointer is secondary
                    if(keyName.isSecondary) {
                        // Move it to the include list
                        include.push(keyName.pointerIdKey);
                    }
                    else {
                        // Use the via key
                        keys.push(`${keyName.pointerIdKey}${Pointer.IdDelimiter}${keyName.viaKey}`);
                    }
                }
                else keys.push(key);
            }
            else
                throw new Error(Error.Code.ForbiddenOperation, `Select key \`${key}\` does not exist in \`${this.class.className}\``);
        }
        
        // Check include keys
        for(let key of include) {
            // Validate key
            this.class.has(key);

            // Add it to the select keys and included joins
            keys.push(key);
            includedJoins[Pointer.getAliasFrom(key)] = true;

            // If the key is from a secondary join, add the parent join
            const join = metadata.joins[Pointer.getAliasFrom(key)].toPointer();
            if(join.isSecondary) {
                includedJoins[join.parentAliasKey] = true;
            }
        }

        // Create joins
        const joins = Object.keys(metadata.joins).reduce((map, key) => {
            // Get join 
            const join = metadata.joins[key];
            map[key] = { join, included: includedJoins[key] };
            return map;
        }, {});

        return { select: keys, joins };
    }

    private getConstraints(prefix: string = '') {
        // Create a new instance of where
        const where = new ConstraintMap(this._where.toJSON());

        // Iterate through keys
        for(let key of where.getKeys()) {
            // Check if key exists
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            // Check if key is compound
            if(CompoundKey.isUsedBy(key)) {
                const keys = CompoundKey.from(key).map(k => prefix + this.class.getConstraintKey(k));
                where.changeKey(key, keys.join(CompoundKey.Delimiter));
            }
            else where.changeKey(key, prefix + this.class.getConstraintKey(key));
        }

        return where;
    }

    private getSorting(): Array<string> {
        // Prepare sort key
        const sort = this._sort;

        // Prepare sorting
        const sorting: Array<string> = [];

        // Iterate through each sort
        for(let key of sort) {
            // Check if key exists
            if(!this.class.has(key.replace('-', '')))
                throw new Error(Error.Code.ForbiddenOperation, `The sort key \`${key}\` does not exist`);

            // Add className to sort key if it is not a pointer
            if(!Pointer.isUsedBy(key))
                key = `${key.indexOf('-') >= 0? '-' : ''}${this.class.className}.${key.replace('-', '')}`;
            
            // Push the key
            sorting.push(key);
        }

        return sorting;
    }

    getClassFromKeyMap<T extends Class>(keys: KeyMap): T {
        // Get internal keys
        const id = keys.get(InternalKeys.Id);
        const createdAt = keys.get(InternalKeys.Timestamps.CreatedAt);
        const updatedAt = keys.get(InternalKeys.Timestamps.UpdatedAt);

        // Remove id from the key map
        keys.remove(InternalKeys.Id);

        // Return the new class
        return <T>(new this.class({ keyMap: keys, id, createdAt, updatedAt }));
    }

    toQueryOptions() {
        // Get prefix
        const prefix = this._isSubquery? this.SubqueryPrefix : '';

        // Get class alias
        const classAlias = prefix + this.class.className;

        // Get keys and joins
        const { select, joins } = this.getKeys();

        // Get where constraints
        const where = this.getConstraints(prefix);

        // Get sorting
        const sorting = this.getSorting();

        return {
            source: this.class.source,
            classAlias,
            select,
            joins,
            where,
            sorting,
            skip: this._skip,
            limit: this._limit
        };
    }

}