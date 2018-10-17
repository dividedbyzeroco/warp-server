import Class from '../classes/class';
export default class Collection<T extends Class> {
    _collection: Array<T>;
    constructor(collection: Array<T>);
    readonly length: number;
    count(): number;
    /**
     * Get the first item from the collection
     */
    first(): T | null;
    /**
     * Get the last Object from the collection
     */
    last(): T | null;
    /**
     * Return Objects that pass a given evaluator
     * @param {Function} evaluator
     */
    where(evaluator: (object: T) => boolean): Collection<T>;
    /**
     * Map Objects into an array using an iterator
     * @param {Function} iterator
     */
    map(iterator: (object: T) => any): Array<any>;
    /**
     * Iterate through each item
     * @param {Function} iterator
     */
    forEach(iterator: (object: T) => void): void;
    /**
     * Alias of toArray()
     */
    toList(): any[];
    /**
     * Convert the collection into an array
     */
    toArray(): any[];
    /**
     * Convert the collection into an object literal
     */
    toJSON(): any[];
    /**
     * Run a promise iterator over every Object, in series
     * @param {Function} iterator
     */
    each(iterator: (object: T) => Promise<any>): Promise<void>;
    /**
     * Run a promise iterator over every Object, in parallel
     */
    all(iterator: (object: T) => Promise<any>): Promise<void>;
    [Symbol.iterator](): Iterator<T | undefined>;
}
