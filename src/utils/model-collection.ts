import { ModelClass } from '../classes/model';

export default class ModelCollection<T extends ModelClass> {

    _collection: Array<T>;

    constructor(collection: Array<T>) {
        this._collection = collection;
    }

    first(): T | void {
        return this._collection[0];
    }

    toJSON() {
        return this._collection.map(model => model.toJSON());
    }
}