import Class from '../classes/class';
export default class ClassCollection<T extends Class> {
    _collection: Array<T>;
    constructor(collection: Array<T>);
    first(): T | void;
    toJSON(): object[];
}
