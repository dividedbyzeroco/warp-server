import enforce from 'enforce-js';
import { IDatabaseAdapter } from '../types/database';
import Class from './class';
import Query from './query';
import Collection from '../utils/collection';
import Error from '../utils/error';
import { InternalKeys } from '../utils/constants';
import { ClassMapType } from '../types/class';
import { User } from '..';

export default class DataMapper {

    _database: IDatabaseAdapter;
    _classes: ClassMapType = {};

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
     * Register classes to data mapper
     * @param classMap
     */
    register(classMap: ClassMapType) {
        // Iterate through class map
        for(const [className, classType] of Object.entries(classMap)) {
            // Make a sample instance
            const sampleInstance = new classType;

            // Check data type
            enforce`${{ [className]: sampleInstance }} as a ${{ Class }}`;

            // Add to classes
            this._classes[classType.className] = classType;
        }
    }

    /**
     * Get class from registry
     * @param className
     */
    get(className: string) {
        // Get class
        const classType = this._classes[className];

        // Check if class exists
        if(typeof classType === 'undefined')
            throw new Error(Error.Code.MissingConfiguration, `Class '${className}' has not been registered`);

        // Return class
        return classType;
    }

    /**
     * Find objects
     * @param Query
     */
    async find<T extends typeof Class>(query: Query<T>): Promise<Collection<T['prototype']>> {
        // Validate instance
        enforce`${{ QueryToFind: query }} as a ${{ Query }}`;

        // Get query options
        const {
            source,
            classAlias,
            select,
            joins,
            where,
            sorting,
            skip,
            limit,
        } = query.toQueryOptions();

        // Execute find
        const result = await this._database.find(
            source, 
            classAlias, 
            select, 
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
        // Validate instance
        enforce`${{ QueryToFind: query }} as a ${{ Query }}`;

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
        // Validate instance
        const classInstance = new classType;
        enforce`${{ ClassToGet: classInstance }} as a ${{ Class }}`;
        
        // Prepare query
        const query = new Query(classType)
            .equalTo(InternalKeys.Id, id);

        if(typeof select !== 'undefined') query.select(select);
        if(typeof include !== 'undefined') query.include(include);

        // Get parameters
        const { 
            source,
            classAlias,
            select: keys, 
            joins,
            where
        } = query.toQueryOptions();

        // Execute first
        const result = await this._database.get(
            source, 
            classAlias, 
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
    async save<T extends User | undefined>(classInstance: Class, user?: T) {
        // Validate instance
        enforce`${{ ClassToSave: classInstance }} as a ${{ Class }}`;

        // Run beforeSave as master
        await classInstance.beforeSave(this, user);

        // Get keys to save
        const keys = classInstance._keys;

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
        try { classInstance.afterSave(this, user); } catch(err) { /* Do nothing */ }

        // Return immediately
        return classInstance;
    }

    /**
     * Destroy the Object
     * @param classInstance
     */
    async destroy<T extends User | undefined>(classInstance: Class, user?: T) {
        // Validate instance
        enforce`${{ ClassToDestroy: classInstance }} as a ${{ Class }}`;

        // Run beforeDestroy
        await classInstance.beforeDestroy(this, user);

        // Get keys
        const keys = classInstance._keys;

        // Execute destroy query
        await this._database.destroy(classInstance.statics().className, keys, classInstance.id);

        // Run the afterDestroy method in the background
        try { classInstance.afterDestroy(this, user); } catch(err) { /* Do nothing */ }

        // Return immediately
        return;
    }

}