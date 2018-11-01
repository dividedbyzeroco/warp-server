import enforce from 'enforce-js';
import Class from './class';
import Pointer from './pointer';
import ConstraintMap, { Constraints } from '../../utils/constraint-map';
import { toDatabaseDate } from '../../utils/format';
import Error from '../../utils/error';
import { InternalKeys, Defaults } from '../../utils/constants';
import KeyMap from '../../utils/key-map';
import CompoundKey from '../../utils/compound-key';

export default class Query<T extends typeof Class> {

    private classType: typeof Class;
    private selection: Array<string> = [];
    private included: Array<string> = [];
    private constraints: ConstraintMap = new ConstraintMap();
    private sorting: Array<string> = Defaults.Query.Sort;
    private skipped: number = Defaults.Query.Skip;
    private limitation: number = Defaults.Query.Limit;
    private isSubquery: boolean = false;

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
        if(!this.class.has(key))
            throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

        // Convert to string if value is a date
        if(value instanceof Date) value = toDatabaseDate(value.toISOString());

        // Set the constraint
        this.constraints.set(key, constraint, value);
        return this;
    }

    get SubqueryPrefix() {
        return 'subquery_';
    }

    get class() {
        return this.classType;
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
    foundIn<C extends typeof Class>(key: string, select: string, value: Query<C>): this {
        // Set constraint
        this.set(key, Constraints.FoundIn, value.toSubquery(select));
        return this;
    }

    /**
     * Assert that the key matches a key in any of the given subqueries
     * @param {String} key
     * @param {Array} value 
     */
    foundInEither<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
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
    foundInAll<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
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
    notFoundIn<C extends typeof Class>(key: string, select: string, value: Query<C>): this {
        // Set constraint
        this.set(key, Constraints.NotFoundIn, value.toSubquery(select));
        return this;
    }

    /**
     * Assert that the key does not match a key in either of the given subqueries
     * @param {String} key
     * @param {Array} value 
     */
    notFoundInEither<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
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
    notFoundInAll<C extends typeof Class>(key: string, value: Array<{[keyMatch: string]: Query<C>}>): this {
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
    select(key: string): this;
    select(keys: string[]): this;
    select(...keys: string[]): this;
    select(...keys: any[]): this {
        // Check if first key is an array
        if(keys.length === 0) throw new Error(Error.Code.MissingConfiguration, 'Select key must be a string or an array of strings');
        const keyList: Array<string> = keys[0] instanceof Array? keys[0] : keys;

        // Loop through the keys
        for(let key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this.selection.push(key);
        }

        return this;
    }

    /**
     * Include pointer keys for the query
     * @param {String} keys
     */
    include(key: string): this;
    include(keys: string[]): this;
    include(...keys: string[]): this;
    include(...keys: any[]): this {
        // Check if first key is an array
        if(!keys) throw new Error(Error.Code.MissingConfiguration, 'Include key must be a string or an array of strings');
        const keyList: Array<string> = keys[0] instanceof Array? keys[0] : keys;

        // Loop through the keys
        for(let key of keyList) {
            enforce`${{key}} as a string`;

            // Check if the key exists for the class
            if(!this.class.has(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this.included.push(key);
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

            // Get rawKey
            const rawKey = key[0] === '-' ? key.substr(1) : key;

            // Check if the key exists for the class
            if(!this.class.has(rawKey))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            this.sorting.push(key);
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

            this.sorting.push(`-${key}`);
        }
        return this;
    }

    /**
     * Number of items to skip for the query
     * @param {String} keys
     */
    skip(value: number) {
        enforce`${{ skip: value }} as a number, greater than or equal to 0`;
        this.skipped = value;
        return this;
    }

    /**
     * Number of items to fetch, at maximum
     * @param {String} keys
     */
    limit(value: number) {
        enforce`${{ limit: value }} as a number, greater than or equal to 0`;
        this.limitation = value;
        return this;
    }

    /**
     * Convert the query into a subquery
     * @param {String} select 
     */
    toSubquery(select: string) {
        this.selection = [];
        this.select(select);
        this.isSubquery = true;
        return this;
    }

    where(constraints: { [key: string]: { [constraint: string]: any } }) {
        this.constraints = new ConstraintMap(constraints);
    }

    private getKeys() {
        // Get definition
        const definition = this.class.prototype.getDefinition();

        // Prepare selection keys
        let select = this.selection;
        let include = this.included;

        // Get parameters
        const keys: Array<string> = [];
        const includedJoins = {};

        // If select is empty, use the default keys
        if(select.length === 0) {
            select = [InternalKeys.Id, ...definition.keys, ...Object.values(definition.timestamps)];
        }

        // Iterate through the selected keys
        for(let key of select) {
            // If the key is an internal key
            if(key === InternalKeys.Id || definition.timestamps[key]) {
                // Push the key
                keys.push(key);
            }
            // If it is a pointer key (uses '.')
            else if(Pointer.isUsedBy(key)) {
                // Move it to the include list
                include.push(key);
            }
            // If it is a regular key and it exists
            else if(definition.keys.includes(key)) {
                // Check if pointer exists
                const pointerDefinition = definition.joins[key];

                // If they key provided is a pointer (foreign key without '.')
                if(typeof pointerDefinition !== 'undefined') {
                    // Get pointer
                    const pointer = pointerDefinition.toPointer();

                    // If the pointer is secondary
                    if(pointer.isSecondary) {
                        // Move it to the include list
                        include.push(pointer.idKey);
                    }
                    else {
                        // Use the via key
                        keys.push(`${pointer.idKey}${Pointer.IdDelimiter}${pointer.viaKey}`);
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
            const pointerDefinition = definition.joins[Pointer.getAliasFrom(key)];
            const join = pointerDefinition.toPointer();
            if(join.isSecondary) {
                includedJoins[join.parentAliasKey] = true;
            }
        }

        // Create joins
        const joins = Object.keys(definition.joins).reduce((map, key) => {
            // Get join 
            const join = definition.joins[key].toPointer();
            map[key] = { join, included: includedJoins[key] };
            return map;
        }, {});

        return { select: keys, joins };
    }

    private getConstraints(prefix: string = '') {
        // Create a new instance of where
        const where = new ConstraintMap(this.constraints.toJSON());

        // Iterate through keys
        for(let key of where.keys) {
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
        const sort = this.sorting;

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

    getClassFromKeys<C extends Class>(keys: KeyMap): C {
        // Get internal keys
        const id = keys.get(InternalKeys.Id);

        // Remove id from the key map
        keys.remove(InternalKeys.Id);

        // Return the new class
        const classInstance = <C>(new this.class);
        classInstance._id = id;
        classInstance._keys = keys;

        return classInstance;
    }

    toQueryOptions() {
        // Get prefix
        const prefix = this.isSubquery? this.SubqueryPrefix : '';

        // Get class alias
        const classAlias = prefix + this.class.className;

        // Get select and joins
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
            skip: this.skipped,
            limit: this.limitation
        };
    }

}