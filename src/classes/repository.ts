import { IDatabaseAdapter } from '../types/database';
import Class from './class';
import Query from './query';
import Collection from '../utils/collection';
import { InternalKeys } from '../utils/constants';

export default class Repository {

    _database: IDatabaseAdapter;

    constructor(database: IDatabaseAdapter) {
        this._database = database;
    }

    /**
     * Connect to the database
     */
    async initialize() {
        return await this._database.initialize();
    }

    /**
     * Find objects
     * @param Query
     */
    async find<T extends typeof Class>(query: Query<T>): Promise<Collection<T['prototype']>> {
        // Get query options
        const {
            source,
            className,
            keys,
            joins,
            where,
            sorting,
            skip,
            limit,
        } = query.toQueryOptions();

        // Execute find
        const result = await this._database.find(
            source, 
            className, 
            keys, 
            joins,
            where,
            sorting, 
            skip, 
            limit
        );

        // Prepare rows
        const rows: T['prototype'][] = [];
        for(let row of result) {
            // Push the row
            rows.push(query.getClassFromKeyMap<T['prototype']>(row));
        }
        
        // Return the result
        return new Collection(rows);
    }

    async first<T extends typeof Class>(query: Query<T>): Promise<T['prototype'] | null> {
        // Limit to first item
        query.limit(1);

        // Get result
        const result = await this.find(query);

        // If collection is empty, return null
        if(result.count() === 0) return null;
        else return result.first();
    }

    /**
     * Find a single object
     * @param classType
     * @param {number} id
     */
    async getById<T extends typeof Class>(
        classType: T, 
        id: number, 
        select?: Array<string>, 
        include?: Array<string>
    ): Promise<T['prototype'] | null> {
        
        // Prepare query
        const query = new Query(classType)
            .equalTo(InternalKeys.Id, id);

        if(typeof select !== 'undefined') query.select(select);
        if(typeof include !== 'undefined') query.include(include);

        // Get parameters
        const { 
            source,
            className,
            keys, 
            joins,
            where
        } = query.toQueryOptions();

        // Execute first
        const result = await this._database.get(
            source, 
            className, 
            keys, 
            joins,
            where,
            id
        );

        // Return empty result if null
        if(!result) return null;

        // Return result
        return query.getClassFromKeyMap<T['prototype']>(result);
    }

    /**
     * Save the Object
     * @param classInstance
     */
    async save(classInstance: Class) {
        // Run beforeSave as master
        await classInstance.beforeSave();

        // Get keys to save
        const keys = classInstance._keyMap;

        // If the object is new
        if(classInstance.isNew) {
            // Execute create query and retrieve the new id
            classInstance._id = await this._database.create(classInstance.statics().className, keys);
        }
        else {
            // Execute update query
            await this._database.update(classInstance.statics().className, keys, classInstance.id);
        }

        // Run the afterSave method in the background as master
        try { classInstance.afterSave(); } catch(err) { /* Do nothing */ }

        // Return immediately
        return classInstance;
    }

    /**
     * Destroy the Object
     * @param classInstance
     */
    async destroy(classInstance: Class) {
        // Run beforeDestroy
        await classInstance.beforeDestroy();

        // Get keys
        const keys = classInstance._keyMap;

        // Execute destroy query
        await this._database.destroy(classInstance.statics().className, keys, classInstance.id);

        // Run the afterDestroy method in the background
        try { classInstance.afterDestroy(); } catch(err) { /* Do nothing */ }

        // Return immediately
        return;
    }

}