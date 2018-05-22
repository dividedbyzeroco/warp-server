import { ConstraintObject } from '../types/constraints';
export declare class KeyConstraints {
    /**
     * Private properties
     */
    _key: string;
    _map: {
        [constraint: string]: any;
    };
    /**
     * Constructor
     * @param {String} key
     * @param {Object} list
     * @param {String} key
     */
    constructor(key: string, map: {
        [constraint: string]: any;
    });
    readonly key: string;
    readonly list: Array<ConstraintObject>;
    set(constraint: string, value: any): void;
    changeKey(newKey: string): void;
    constraintExists(constraint: string): boolean;
    toJSON(): Object;
}
export declare const Constraints: Readonly<{
    EqualTo: string;
    NotEqualTo: string;
    GreaterThan: string;
    GreaterThanOrEqualTo: string;
    LessThan: string;
    LessThanOrEqualTo: string;
    Exists: string;
    ContainedIn: string;
    NotContainedIn: string;
    ContainedInOrDoesNotExist: string;
    StartsWith: string;
    EndsWith: string;
    Contains: string;
    ContainsEither: string;
    ContainsAll: string;
    FoundIn: string;
    FoundInEither: string;
    FoundInAll: string;
    NotFoundIn: string;
    NotFoundInEither: string;
}>;
export declare const Subqueries: Readonly<{
    FoundIn: string;
    FoundInEither: string;
    FoundInAll: string;
    NotFoundIn: string;
    NotFoundInEither: string;
}>;
export default class ConstraintMap {
    /**
     * Private properties
     */
    private _map;
    static readonly Constraints: {
        [name: string]: string;
    };
    static readonly Subqueries: {
        [name: string]: string;
    };
    /**
     * Constructor
     * @param {Object} keyValuePairs
     */
    constructor(constraints?: {
        [key: string]: {
            [key: string]: any;
        };
    });
    set(key: string, constraint: string, value: any): void;
    changeKey(key: string, newKey: string): void;
    get(key: string): KeyConstraints;
    getKeys(): Array<string>;
    getConstraints(key: string): Array<Object>;
    equalTo(key: string, value: any): void;
    notEqualTo(key: string, value: any): void;
    greaterThan(key: string, value: any): void;
    greaterThanOrEqualTo(key: string, value: any): void;
    lessThan(key: string, value: any): void;
    lessThanOrEqualTo(key: string, value: any): void;
    exists(key: string): void;
    doesNotExist(key: string): void;
    containedIn(key: string, value: Array<any>): void;
    notContainedIn(key: string, value: Array<any>): void;
    containedInOrDoesNotExist(key: string, value: Array<any>): void;
    startsWith(key: string, value: string): void;
    endsWith(key: string, value: string): void;
    contains(key: string, value: string): void;
    containsEither(key: string, value: Array<string>): void;
    containsAll(key: string, value: Array<string>): void;
    foundIn(key: string, value: Object): void;
    foundInEither(key: string, value: Object): void;
    foundInAll(key: string, value: Object): void;
    notFoundIn(key: string, value: Object): void;
    notFoundInEither(key: string, value: Object): void;
    toList(): KeyConstraints[];
    toJSON(): {};
}
