import enforce from 'enforce-js';
import Class from './class';
import Query from './query';
import User from '../auth/user';
import { IDatabaseAdapter } from '../../types/database';
import Collection from '../../utils/collection';
import Error from '../../utils/error';
import { InternalKeys, TriggerBeforeSave, TriggerAfterSave, TriggerBeforeDestroy, TriggerAfterDestroy, TriggerBeforeFind, TriggerBeforeFirst, TriggerBeforeGet } from '../../utils/constants';
import { ClassMapType, ClassOptions } from '../../types/class';

export default class ClassManager {

    private database: IDatabaseAdapter;
    private classes: ClassMapType<any> = {};

    constructor(database: IDatabaseAdapter) {
        this.database = database;
    }

    /**
     * Connect to the database
     */
    async initialize() {
        return await this.database.initialize();
    }

    /**
     * Register classes to data mapper
     * @param classMap
     */
    register(classMap: ClassMapType<any>) {
        // Iterate through class map
        for(const [className, classType] of Object.entries<typeof Class>(classMap)) {
            // Make a sample instance
            const sampleInstance = new classType;

            // Check data type
            enforce`${{ [className]: sampleInstance }} as a ${{ Class }}`;

            // Add to classes
            this.classes[classType.className] = classType;
        }
    }

    /**
     * Get class from registry
     * @param className
     */
    get<C extends typeof Class>(className: string) {
        // Get class
        const classType: C = this.classes[className];

        // Check if class exists
        if(typeof classType === 'undefined')
            throw new Error(Error.Code.ClassNotFound, `Class '${className}' has not been registered`);

        // Return class
        return classType;
    }

    /**
     * Find objects
     * @param Query
     */
    async find<C extends typeof Class, U extends User>(query: Query<C>, opts: ClassOptions<U> = {}): Promise<Collection<C['prototype']>> {
        // Validate instance
        enforce`${{ QueryToFind: query }} as a ${{ Query }}`;

        // Create classInstance
        const classInstance = new query.class;

        // Get definition
        const definition = classInstance.getDefinition();

        // Run all beforeFind triggers
        const beforeFindTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeFind);
        for(const trigger of beforeFindTriggers) await trigger.action.apply(classInstance, [query, opts]);

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
        const result = await this.database.find(
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
        const rows: C['prototype'][] = [];
        for(let row of result) {
            // Push the row
            rows.push(query.getClassFromKeys<C['prototype']>(row));
        }
        
        // Return the result
        return new Collection(rows);
    }

    async first<C extends typeof Class, U extends User>(query: Query<C>, opts: ClassOptions<U> = {}): Promise<C['prototype'] | null> {
        // Validate instance
        enforce`${{ QueryToFindFirst: query }} as a ${{ Query }}`;

        // Limit to first item
        query.limit(1);

        // Create classInstance
        const classInstance = new query.class;

        // Get definition
        const definition = classInstance.getDefinition();

        // Run all beforeFirst triggers
        const beforeFirstTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeFirst);
        for(const trigger of beforeFirstTriggers) await trigger.action.apply(classInstance, [query, opts]);

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
    async getById<C extends typeof Class, U extends User>(
        classType: C, 
        id: number, 
        include?: Array<string>,
        select?: Array<string>, 
        opts: ClassOptions<U> = {}
    ): Promise<C['prototype'] | null> {
        // Validate instance
        const classInstance = new classType;
        enforce`${{ ClassToGet: classInstance }} as a ${{ Class }}`;
        
        // Prepare query
        const query = new Query(classType)
            .equalTo(InternalKeys.Id, id);

        if(typeof select !== 'undefined') query.select(select);
        if(typeof include !== 'undefined') query.include(include);

        // Get definition
        const definition = classInstance.getDefinition();

        // Run all beforeGet triggers
        const beforeGetTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeGet);
        for(const trigger of beforeGetTriggers) await trigger.action.apply(classInstance, [query, opts]);

        // Get parameters
        const { 
            source,
            classAlias,
            select: keys, 
            joins,
            where
        } = query.toQueryOptions();

        // Execute first
        const result = await this.database.get(
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
        return query.getClassFromKeys<C['prototype']>(result);
    }

    /**
     * Save the Object
     * @param classInstance
     */
    async save<C extends Class, U extends User | undefined>(classInstance: C, opts: ClassOptions<U> = {}) {
        // Validate instance
        enforce`${{ ClassToSave: classInstance }} as a ${{ Class }}`;

        // Get definition
        const definition = classInstance.getDefinition();

        // Run all beforeSave triggers
        const beforeSaveTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeSave);
        for(const trigger of beforeSaveTriggers) await trigger.action.apply(classInstance, [this, opts]);

        // Get keys to save
        const keys = classInstance._keys;

        // If the object is new
        if(classInstance.isNew) {
            // Execute create query and retrieve the new id
            classInstance._id = await this.database.create(classInstance.statics().className, keys);
        }
        else {
            // Execute update query
            await this.database.update(classInstance.statics().className, keys, classInstance.id);
        }

        try { 
            // Run all afterSave triggers in the background
            const afterSaveTriggers = definition.triggers.filter(trigger => trigger.type === TriggerAfterSave);
            for(const trigger of afterSaveTriggers) await trigger.action.apply(classInstance, [this, opts]);
        } 
        catch(err) { /* do nothing */ }

        // Return immediately
        return classInstance;
    }

    /**
     * Destroy the Object
     * @param classInstance
     */
    async destroy<C extends Class, U extends User | undefined>(classInstance: C, opts: ClassOptions<U> = {}) {
        // Validate instance
        enforce`${{ ClassToDestroy: classInstance }} as a ${{ Class }}`;

        // Get definition
        const definition = classInstance.getDefinition();

        // Run all beforeDestroy triggers
        const beforeDestroyTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeDestroy);
        for(const trigger of beforeDestroyTriggers) await trigger.action.apply(classInstance, [this, opts]);

        // Get keys
        const keys = classInstance._keys;

        // Execute destroy query
        await this.database.destroy(classInstance.statics().className, keys, classInstance.id);

        try { 
            // Run all afterDestroy triggers in the background
            const afterDestroyTriggers = definition.triggers.filter(trigger => trigger.type === TriggerAfterDestroy);
            for(const trigger of afterDestroyTriggers) await trigger.action.apply(classInstance, [this, opts]);
         } 
         catch(err) { /* Do nothing */ }

        // Return immediately
        return;
    }

}