import Error from './error';
import { ConstraintObject } from '../types/constraints';

export class KeyConstraints {

    /**
     * Private properties
     */
    _key: string;
    _map: {[constraint: string]: any};

    /**
     * Constructor
     * @param {String} key
     * @param {Object} list
     * @param {String} key
     */
    constructor(key: string, map: {[constraint: string]: any}) {
        // Set values
        this._key = key;
        this._map = map;
    }

    get key(): string {
        return this._key;
    }

    get list(): Array<ConstraintObject> {
        return Object.keys(this._map).map(constraint => {
            return { key: this.key, constraint: constraint, value: this._map[constraint] };
        });
    }

    set(constraint: string, value: any) {
        this._map[constraint] = value;
    }

    changeKey(newKey: string) {
        this._key = newKey;
    }

    constraintExists(constraint: string) {
        return typeof this._map[constraint] !== 'undefined';
    }

    toJSON(): Object {
        return { ...this._map };
    }
}

export const Constraints = Object.freeze({
    EqualTo: 'eq',
    NotEqualTo: 'neq',
    GreaterThan: 'gt',
    GreaterThanOrEqualTo: 'gte',
    LessThan: 'lt', 
    LessThanOrEqualTo: 'lte',
    Exists: 'ex',
    ContainedIn: 'in', 
    NotContainedIn: 'nin',
    ContainedInOrDoesNotExist: 'inx',
    StartsWith: 'str',
    EndsWith: 'end',
    Contains: 'has',
    ContainsEither: 'hasi',
    ContainsAll: 'hasa',
    FoundIn: 'fi', 
    FoundInEither: 'fie',
    FoundInAll: 'fia',
    NotFoundIn: 'nfi',
    NotFoundInEither: 'nfe'
});

export const Subqueries = Object.freeze({
    FoundIn: 'fi', 
    FoundInEither: 'fie',
    FoundInAll: 'fia',
    NotFoundIn: 'nfi',
    NotFoundInEither: 'nfe'
});

export default class ConstraintMap {

    /**
     * Private properties
     */
    private _map: {[key: string]: KeyConstraints} = {};

    static get Constraints(): {[name: string]: string} {
        return Constraints;
    }

    static get Subqueries(): {[name: string]: string} {
        return Subqueries;
    }

    /**
     * Constructor
     * @param {Object} keyValuePairs
     */
    constructor(constraints: {[key: string]: { [key: string]: any }} = {}) {
        // Populate map
        for(let key in constraints) {
            this._map[key] = new KeyConstraints(key, constraints[key]);
        }
    }

    set(key: string, constraint: string, value: any) {
        const constraints = this._map[key] || new KeyConstraints(key, {});
        constraints.set(constraint, value);
        this._map[key] = constraints;
    }

    changeKey(key: string, newKey: string) {
        const constraints = this._map[key];
        if(!constraints)
            throw new Error(Error.Code.MissingConfiguration, `Constraint key being changed does not exist: \`${key}\``);

        // Don't change keys if they are the same
        if(key === newKey) return;

        constraints.changeKey(newKey);
        this._map[newKey] = constraints;
        delete this._map[key];
    }

    get(key: string): KeyConstraints {
        return this._map[key];
    }

    getKeys(): Array<string> {
        return Object.keys(this._map);
    }

    getConstraints(key: string): Array<Object> {
        // Get the value for the keyValuePair
        return this._map[key].list;
    }

    equalTo(key: string, value: any) {
        this.set(key, Constraints.EqualTo, value);
    }

    notEqualTo(key: string, value: any) {
        this.set(key, Constraints.NotEqualTo, value);
    }

    greaterThan(key: string, value: any) {
        this.set(key, Constraints.GreaterThan, value);
    }

    greaterThanOrEqualTo(key: string, value: any) {
        this.set(key, Constraints.GreaterThanOrEqualTo, value);
    }

    lessThan(key: string, value: any) {
        this.set(key, Constraints.LessThan, value);
    }

    lessThanOrEqualTo(key: string, value: any) {
        this.set(key, Constraints.LessThanOrEqualTo, value);
    }

    exists(key: string) {
        this.set(key, Constraints.Exists, true);
    }

    doesNotExist(key: string) {
        this.set(key, Constraints.Exists, false);
    }

    containedIn(key: string, value: Array<any>) {
        this.set(key, Constraints.ContainedIn, value);
    }

    notContainedIn(key: string, value: Array<any>) {
        this.set(key, Constraints.NotContainedIn, value);
    }

    containedInOrDoesNotExist(key: string, value: Array<any>) {
        this.set(key, Constraints.ContainedInOrDoesNotExist, value);
    }

    startsWith(key: string, value: string) {
        this.set(key, Constraints.StartsWith, value);
    }

    endsWith(key: string, value: string) {
        this.set(key, Constraints.EndsWith, value);
    }

    contains(key: string, value: string) {
        this.set(key, Constraints.Contains, value);
    }

    containsEither(key: string, value: Array<string>) {
        this.set(key, Constraints.ContainsEither, value);
    }

    containsAll(key: string, value: Array<string>) {
        this.set(key, Constraints.ContainsAll, value);
    }

    foundIn(key: string, value: Object) {
        this.set(key, Constraints.FoundIn, value);
    }

    foundInEither(key: string, value: Object) {
        this.set(key, Constraints.FoundInEither, value);
    }

    foundInAll(key: string, value: Object) {
        this.set(key, Constraints.FoundInAll, value);
    }

    notFoundIn(key: string, value: Object) {
        this.set(key, Constraints.NotFoundIn, value);
    }

    notFoundInEither(key: string, value: Object) {
        this.set(key, Constraints.NotFoundInEither, value);
    }

    toList() {
        return Object.keys(this._map).map(key => this._map[key]);
    }

    toJSON() {
        return Object.keys(this._map).reduce((map, key) => {
            map[key] = this._map[key].toJSON();
            return map;
        }, {});
    }
}