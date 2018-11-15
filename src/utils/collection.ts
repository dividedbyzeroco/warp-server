import Class from '../features/orm/class';
import { toCamelCase } from './format';
import { InternalId } from './constants';

export default class Collection<T extends Class> {

    _collection: Array<T>;

    constructor(collection: Array<T>) {
        this._collection = collection;
    }

    get length(): number {
        return this._collection.length;
    }

    count(): number {
        return this.length;
    }

    /**
     * Get the first item from the collection
     */
    first(): T | null {
        return this._collection.length > 0? this._collection[0] : null;
    }

    /**
     * Get the last Object from the collection
     */
    last(): T | null {
        return this._collection.length > 0? this._collection[this._collection.length - 1] : null;
    }

    /**
     * Return Objects that pass a given evaluator
     * @param {Function} evaluator 
     */
    where(evaluator: (object: T) => boolean): Collection<T> {
        const objects = [...this._collection];
        const map: Array<T> = [];

        for(let object of objects) {
            if(evaluator(object)) {
                map.push(object);
            }
        }

        const constructor = this.constructor as typeof Collection;
        return new constructor(map);
    }

    /**
     * Map Objects into an array using an iterator
     * @param {Function} iterator 
     */
    map<U extends any>(iterator: (object: T) => any): Array<U> {
        const objects = [...this._collection];
        const map: Array<U> = [];

        for(let object of objects) {
            map.push(iterator(object));
        }

        return map;
    }

    /**
     * Iterate through each item
     * @param {Function} iterator 
     */
    forEach(iterator: (object: T) => void): void {
        const objects = [...this._collection];

        for(let object of objects) {
            iterator(object);
        }
    }

    /**
     * Alias of toArray()
     */
    toList() {
        return this.toArray();
    }

    /**
     * Convert the collection into an array
     */
    toArray() {
        return this._collection.map(object => object);
    }

    /**
     * Convert the collection into a Map, based on the given iterator
     * @param iterator 
     */
    toMap(iterator: string | ((object: T) => any) = InternalId) {
        // Get key
        const getKey = typeof iterator === 'function' ? iterator : object => object[toCamelCase(iterator)];

        // Return a map
        const entries = this._collection.map<[ any, T ]>(object => [ getKey(object), object ] );
        return new Map(entries);
    }

    /**
     * Convert the collection into an object literal
     */
    toJSON() {
        return this._collection.map(object => object.toJSON());
    }

    /**
     * Run a promise iterator over every Object, in series
     * @param {Function} iterator
     */
    async each(iterator: (object: T) => Promise<any>): Promise<void> {
        // Get objects
        const objects = [...this._collection];

        for(let object of objects) {
            await iterator(object);
        }

        return;
    }

    /**
     * Run a promise iterator over every Object, in parallel
     */
    async all(iterator: (object: T) => Promise<any>): Promise<void> {
        // Define iterators
        const iterators = this.map(object => iterator(object));

        await Promise.all(iterators);
        return;
    }

    [Symbol.iterator](): Iterator<T> {
        // Set index to 0
        let index = 0;

        return {
            next: () => {
                // Return iterator result
                return { value: this._collection[index++], done: index >= this._collection.length };
            }
        };
    }
}