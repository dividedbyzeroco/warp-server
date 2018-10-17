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
    toList(): KeyConstraints[];
    toJSON(): {};
}
