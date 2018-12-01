import Error from './error';

export interface ConstraintObject {
    key: string;
    constraint: string;
    value: any;
}

export class KeyConstraints {

    /**
     * Private properties
     */
    private keyName: string;
    private map: { [constraint: string]: any };

    /**
     * Constructor
     * @param {String} key
     * @param {Object} list
     * @param {String} key
     */
    constructor(key: string, map: {[constraint: string]: any}) {
        // Set values
        this.keyName = key;
        this.map = map;
    }

    get key(): string {
        return this.keyName;
    }

    get constraints(): ConstraintObject[] {
        return Object.keys(this.map).map(constraint => {
            return { key: this.key, constraint, value: this.map[constraint] };
        });
    }

    public set(constraint: string, value: any) {
        this.map[constraint] = value;
    }

    public changeKey(newKey: string) {
        this.keyName = newKey;
    }

    public toJSON(): object {
        return { ...this.map };
    }
}

export const Subqueries = Object.freeze({
    FoundIn: 'fi',
    FoundInEither: 'fie',
    FoundInAll: 'fia',
    NotFoundIn: 'nfi',
    NotFoundInEither: 'nfe',
    NotFoundInAll: 'nfa',
});

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
    ...Subqueries,
});

export default class ConstraintMap {

    /**
     * Private properties
     */
    private map: { [key: string]: KeyConstraints } = {};

    /**
     * Constructor
     * @param {Object} keyValuePairs
     */
    constructor(constraints: {[key: string]: { [key: string]: any }} = {}) {
        // Populate map
        for (const key in constraints) {
            this.map[key] = new KeyConstraints(key, constraints[key]);
        }
    }

    get keys(): string[] {
        return Object.keys(this.map);
    }

    public set(key: string, constraint: string, value: any) {
        const constraints = this.map[key] || new KeyConstraints(key, {});
        constraints.set(constraint, value);
        this.map[key] = constraints;
    }

    public changeKey(key: string, newKey: string) {
        const constraints = this.map[key];
        if (!constraints)
            throw new Error(Error.Code.MissingConfiguration, `Constraint key being changed does not exist: \`${key}\``);

        // Don't change keys if they are the same
        if (key === newKey) return;

        constraints.changeKey(newKey);
        this.map[newKey] = constraints;
        delete this.map[key];
    }

    public get(key: string): KeyConstraints {
        return this.map[key];
    }

    public toArray() {
        return Object.keys(this.map).map(key => this.map[key]);
    }

    public toJSON() {
        return Object.keys(this.map).reduce((map, key) => {
            map[key] = this.map[key].toJSON();
            return map;
        }, {});
    }
}