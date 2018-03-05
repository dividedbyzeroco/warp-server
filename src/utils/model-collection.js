// @flow
/**
 * References
 */
import Model from '../classes/model';

export default class ModelCollection<+T: Model.Class> {

    /**
     * Private properties
     */
    _collection: Array<any>;

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