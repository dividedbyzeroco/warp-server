import Class from '../classes/class';

export default class ClassCollection<T extends Class> {

    _collection: Array<T>;

    constructor(collection: Array<T>) {
        this._collection = collection;
    }

    first(): T | void {
        return this._collection[0];
    }

    toJSON() {
        return this._collection.map(item => item.toJSON());
    }
}