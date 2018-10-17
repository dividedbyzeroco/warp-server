import { IDatabaseAdapter } from '../types/database';
import Class from './class';
import Query from './query';
import Collection from '../utils/collection';
import { ClassMapType } from '../types/class';
export default class DataMapper {
    _database: IDatabaseAdapter;
    _classes: ClassMapType;
    constructor(database: IDatabaseAdapter);
    /**
     * Connect to the database
     */
    initialize(): Promise<void>;
    /**
     * Register classes to data mapper
     * @param classMap
     */
    register(classMap: ClassMapType): void;
    /**
     * Get class from registry
     * @param className
     */
    get(className: string): typeof Class;
    /**
     * Find objects
     * @param Query
     */
    find<T extends typeof Class>(query: Query<T>): Promise<Collection<T['prototype']>>;
    first<T extends typeof Class>(query: Query<T>): Promise<T['prototype'] | null>;
    /**
     * Find a single object
     * @param classType
     * @param {number} id
     */
    getById<T extends typeof Class>(classType: T, id: number, select?: Array<string>, include?: Array<string>): Promise<T['prototype'] | null>;
    /**
     * Save the Object
     * @param classInstance
     */
    save(classInstance: Class): Promise<Class>;
    /**
     * Destroy the Object
     * @param classInstance
     */
    destroy(classInstance: Class): Promise<void>;
}
