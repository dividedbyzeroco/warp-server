import enforce from 'enforce-js';
import Class, { ClassDefinitionManager } from './class';
import Query from './query';
import User from '../auth/user';
import { IDatabaseAdapter } from '../../types/database';
import Collection from '../../utils/collection';
import Error from '../../utils/error';
import {
    InternalKeys,
    TriggerBeforeSave,
    TriggerAfterSave,
    TriggerBeforeDestroy,
    TriggerAfterDestroy,
    TriggerBeforeFind,
    TriggerBeforeFirst,
    TriggerBeforeGet,
    SetJsonTypeName,
    AppendJsonTypeName,
    InternalId,
} from '../../utils/constants';
import { ClassMapType, ClassOptions } from '../../types/class';
import { Increment, JsonAction } from './specials';
import KeyMap from '../../utils/key-map';

export default class ClassManager {

    private database: IDatabaseAdapter;
    private classes: ClassMapType<any> = {};

    constructor(database: IDatabaseAdapter) {
        this.database = database;
    }

    /**
     * Get key map from instance
     * @param classInstance
     */
    private getKeyMapFrom<C extends Class>(classInstance: C) {
        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());

        // Get class keys
        const classKeys = classInstance.keys;

        // Set keys to save
        const keys = classKeys.toArray().reduce((keyMap, keyValue) => {
            // Get key map
            const [ key, value ] = keyValue;

            // Get relation definition
            const relationDefinition = definition.relations[key];

            // Check if relation definition exists
            if (typeof relationDefinition  !== 'undefined') {
                // Get key source
                const keySource = relationDefinition.toRelation().sourceKey;

                // Set key value
                keyMap.set(keySource, value.id);

            } else keyMap.set(key, value);

            // Return key map
            return keyMap;

        }, new KeyMap);

        // Return keys
        return keys;
    }

    /**
     * Connect to the database
     */
    public async initialize() {
        return await this.database.initialize();
    }

    /**
     * Register classes to data mapper
     * @param classMap
     */
    public register(classMap: ClassMapType<any>) {
        // Iterate through class map
        for (const [ className, classType ] of Object.entries<typeof Class>(classMap)) {
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
    public get<C extends typeof Class>(className: string) {
        // Get class
        const classType: C = this.classes[className];

        // Check if class exists
        if (typeof classType === 'undefined')
            throw new Error(Error.Code.ClassNotFound, `Class '${className}' has not been registered`);

        // Return class
        return classType;
    }

    /**
     * Increment the value of a numeric key
     * @param classInstance
     * @param key
     * @param value
     */
    public increment<C extends Class>(classInstance: C, key: string, value: number) {
        // Check if key exists
        if (!classInstance.statics().has(key))
            throw new Error(Error.Code.ForbiddenOperation,
                `Key to be incremented \`${key}\` does not exist in \`${classInstance.statics().className}\``);

        // Set key to an increment value
        classInstance[key] = Increment.by(value);
    }

    /**
     * Set json values
     * @param classInstance
     * @param key
     * @param path
     */
    public json<C extends Class>(classInstance: C, key: string) {
        // Check if key exists
        if (!classInstance.statics().has(key))
            throw new Error(Error.Code.ForbiddenOperation,
                `Key to be incremented \`${key}\` does not exist in \`${classInstance.statics().className}\``);

        return {
            set(path: string, value: any) {
                classInstance[key] = new JsonAction(SetJsonTypeName, key, path, value);
            },
            append(path: string, value: any) {
                classInstance[key] = new JsonAction(AppendJsonTypeName, key, path, value);
            },
        };
    }

    /**
     * Find objects
     * @param query
     * @param opts
     */
    public async find<C extends typeof Class, U extends User>(query: Query<C>, opts: ClassOptions<U> = {}): Promise<Collection<C['prototype']>> {
        // Validate instance
        enforce`${{ QueryToFind: query }} as a ${{ Query }}`;

        // Create classInstance
        const classInstance = new query.class;

        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());

        // Run all beforeFind triggers
        const beforeFindTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeFind);
        for (const trigger of beforeFindTriggers) await trigger.action.apply(classInstance, [ query, opts ]);

        // Get query options
        const {
            source,
            columns,
            relations,
            constraints,
            sorting,
            skipped,
            limitation,
        } = query.toQueryOptions();

        // Execute find
        const result = await this.database.find(
            source,
            columns,
            relations,
            constraints,
            sorting,
            skipped,
            limitation,
        );

        // Prepare rows
        const rows: Array<C['prototype']> = [];
        for (const row of result) {
            // Push the row
            rows.push(query.getClassFromKeys<C['prototype']>(row));
        }

        // Return the result
        return new Collection(rows);
    }

    /**
     * Find the first object that matches
     * @param query
     * @param opts
     */
    public async first<C extends typeof Class, U extends User>(query: Query<C>, opts: ClassOptions<U> = {}): Promise<C['prototype'] | null> {
        // Validate instance
        enforce`${{ QueryToFindFirst: query }} as a ${{ Query }}`;

        // Limit to first item
        query.limit(1);

        // Create classInstance
        const classInstance = new query.class;

        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());

        // Run all beforeFirst triggers
        const beforeFirstTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeFirst);
        for (const trigger of beforeFirstTriggers) await trigger.action.apply(classInstance, [ query, opts ]);

        // Get result
        const result = await this.find(query, opts);

        // If collection is empty, return null
        if (result.count() === 0) return null;
        else return result.first();
    }

    /**
     * Find a single object
     * @param classType
     * @param {number} id
     */
    public async getById<C extends typeof Class, U extends User>(
        classType: C,
        id: number,
        include?: string[],
        select?: string[],
        opts: ClassOptions<U> = {},
    ): Promise<C['prototype'] | null> {
        // Validate instance
        const classInstance = new classType;
        enforce`${{ ClassToGet: classInstance }} as a ${{ Class }}`;

        // Prepare query
        const query = new Query(classType)
            .equalTo(InternalKeys.Id, id)
            .skip(0)
            .limit(1);

        if (typeof select !== 'undefined') query.select(select);
        if (typeof include !== 'undefined') query.include(include);

        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());

        // Run all beforeGet triggers
        const beforeGetTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeGet);
        for (const trigger of beforeGetTriggers) await trigger.action.apply(classInstance, [ query, opts ]);

        // Get parameters
        const {
            source,
            columns,
            relations,
            constraints,
            sorting,
            skipped,
            limitation,
        } = query.toQueryOptions();

        // Execute first
        const result = await this.database.find(
            source,
            columns,
            relations,
            constraints,
            sorting,
            skipped,
            limitation,
        );

        // Return empty result if null
        if (!result) return null;

        // Return result
        return query.getClassFromKeys<C['prototype']>(result[0]);
    }

    /**
     * Save the object
     * @param classInstance
     */
    public async save<C extends Class, U extends User | undefined>(classInstance: C, opts: ClassOptions<U> = {}) {
        // Validate instance
        enforce`${{ ClassToSave: classInstance }} as a ${{ Class }}`;

        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());

        // Run all beforeSave triggers
        const beforeSaveTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeSave);
        for (const trigger of beforeSaveTriggers) await trigger.action.apply(classInstance, [ this, opts ]);

        // Get key map
        const keys = this.getKeyMapFrom(classInstance);

        // If the object is new
        if (classInstance.isNew) {
            // Execute create query and retrieve the new id
            classInstance.identifier = await this.database.create(classInstance.statics().className, keys);
        } else {
            // Execute update query
            await this.database.update(classInstance.statics().className, keys, classInstance.id);
        }

        // Run all afterSave triggers in the background
        const afterSaveTriggers = definition.triggers.filter(trigger => trigger.type === TriggerAfterSave);
        (async () => {
            try {
                for (const trigger of afterSaveTriggers) await trigger.action.apply(classInstance, [ this, opts ]);
            } catch (err) { /* do nothing */ }
        })();

        // Return immediately
        return classInstance;
    }

    /**
     * Destroy the object
     * @param classInstance
     */
    public async destroy<C extends Class, U extends User | undefined>(classInstance: C, opts: ClassOptions<U> = {}) {
        // Validate instance
        enforce`${{ ClassToDestroy: classInstance }} as a ${{ Class }}`;

        // Get definition
        const definition = ClassDefinitionManager.get(classInstance.statics());

        // Run all beforeDestroy triggers
        const beforeDestroyTriggers = definition.triggers.filter(trigger => trigger.type === TriggerBeforeDestroy);
        for (const trigger of beforeDestroyTriggers) await trigger.action.apply(classInstance, [this, opts]);

        // Get key map
        const keys = this.getKeyMapFrom(classInstance);

        // Execute destroy query
        await this.database.destroy(classInstance.statics().className, keys, classInstance.id);

        // Run all afterDestroy triggers in the background
        const afterDestroyTriggers = definition.triggers.filter(trigger => trigger.type === TriggerAfterDestroy);
        (async () => {
            try {
                for (const trigger of afterDestroyTriggers) await trigger.action.apply(classInstance, [this, opts]);
            } catch (err) { /* do nothing */ }
        })();

        // Return immediately
        return;
    }

    /**
     * Generates a batch loader function
     * Compatible with the `dataloader` library of Facebook
     * @param query
     */
    public batch<C extends typeof Class, U extends User>(query: Query<C>, opts?: ClassOptions<U>) {

        return async (ids: number[]) => {
            // Contained in
            query.containedIn(InternalId, ids);

            // Get results
            const results = await this.find(query, opts);

            // Order results
            const resultsMap = results.toMap();
            const orderedResults = ids.map(id => resultsMap.get(id) || null);

            return orderedResults;
        };

    }

}