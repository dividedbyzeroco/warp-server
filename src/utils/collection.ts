import Class from '../features/orm/class';
import { toCamelCase } from './format';
import { InternalId } from './constants';

export default class Collection<T extends Class> {

    private collection: T[];

    constructor(collection: T[]) {
        this.collection = collection;
    }

    get length(): number {
        return this.collection.length;
    }

    public count(): number {
        return this.length;
    }

    /**
     * Get the first item from the collection
     */
    public first(): T | null {
        return this.collection.length > 0 ? this.collection[0] : null;
    }

    /**
     * Get the last Object from the collection
     */
    public last(): T | null {
        return this.collection.length > 0 ? this.collection[this.collection.length - 1] : null;
    }

    /**
     * Return Objects that pass a given evaluator
     * @param {Function} evaluator
     */
    public where(evaluator: (object: T) => boolean): Collection<T> {
        const objects = [...this.collection];
        const map: T[] = [];

        for (const object of objects) {
            if (evaluator(object)) {
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
    public map<U extends any>(iterator: (object: T) => any): U[] {
        const objects = [...this.collection];
        const map: U[] = [];

        for (const object of objects) {
            map.push(iterator(object));
        }

        return map;
    }

    /**
     * Iterate through each item
     * @param {Function} iterator
     */
    public forEach(iterator: (object: T) => void): void {
        const objects = [...this.collection];

        for (const object of objects) {
            iterator(object);
        }
    }

    /**
     * Alias of toArray()
     */
    public toList() {
        return this.toArray();
    }

    /**
     * Convert the collection into an array
     */
    public toArray() {
        return this.collection.map(object => object);
    }

    /**
     * Convert the collection into a Map, based on the given iterator
     * @param iterator
     */
    public toMap(iterator: string | ((object: T) => any) = InternalId) {
        // Get key
        const getKey = typeof iterator === 'function' ? iterator : object => object[toCamelCase(iterator)];

        // Return a map
        const entries = this.collection.map<[ any, T ]>(object => [ getKey(object), object ] );
        return new Map(entries);
    }

    /**
     * Convert the collection into an object literal
     */
    public toJSON() {
        return this.collection.map(object => object.toJSON());
    }

    /**
     * Run a promise iterator over every Object, in series
     * @param {Function} iterator
     */
    public async each(iterator: (object: T) => Promise<any>): Promise<void> {
        // Get objects
        const objects = [...this.collection];

        for (const object of objects) {
            await iterator(object);
        }

        return;
    }

    /**
     * Run a promise iterator over every Object, in parallel
     */
    public async all(iterator: (object: T) => Promise<any>): Promise<void> {
        // Define iterators
        const iterators = this.map(object => iterator(object));

        await Promise.all(iterators);
        return;
    }

    public [Symbol.iterator](): Iterator<T> {
        // Set index to 0
        let index = 0;

        return {
            next: () => {
                // Return iterator result
                return { value: this.collection[index++], done: index >= this.collection.length };
            },
        };
    }
}