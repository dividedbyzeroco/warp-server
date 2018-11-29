import Error from '../../utils/error';
import KeyMap from '../../utils/key-map';
import { toCamelCase, toSnakeCase } from '../../utils/format';
import { InternalKeys, InternalId, RelationTypeName } from '../../utils/constants';
import Relation, { RelationDefinition } from './relation';
import CompoundKey from '../../utils/compound-key';
import { ClassKeys, ClassJSON } from '../../types/class';
import DateKey from './keys/types/date';
import { RelationsMap } from '../../types/relations';
import { TriggersList } from '../../types/triggers';

export const ClassDefinitionSymbol = Symbol.for('warp-server:class-definition');

export interface ClassDefinition {
    keys: string[];
    timestamps: string[];
    relations: RelationsMap;
    triggers: TriggersList;
    hidden: string[];
    guarded: string[];
}

export interface ClassDefinitionOptions {
    className?: string;
    source?: string;
}

const DefaultClassDefinition = {
    keys: [],
    timestamps: Object.values(InternalKeys.Timestamps),
    relations: {},
    triggers: [],
    hidden: [],
    guarded: [],
};

export class ClassDefinitionManager {

    // Resolved issue with: https://github.com/rbuckton/reflect-metadata/issues/53#issuecomment-274906502
    public static get<C extends typeof Class>(classType: C) {
        // Get definition
        const definition = Reflect.getMetadata(ClassDefinitionSymbol, classType) as ClassDefinition || DefaultClassDefinition;

        // Get immutable copy of class definition
        return  {
            keys: definition.keys.slice(),
            timestamps: definition.timestamps.slice(),
            relations: { ...definition.relations },
            triggers: definition.triggers.slice(),
            hidden: definition.hidden.slice(),
            guarded: definition.guarded.slice(),
        };
    }

    public static set<C extends typeof Class>(classType: C, definition: ClassDefinition) {
        Reflect.defineMetadata(ClassDefinitionSymbol, definition, classType);
    }

}

/**
 * Extend Class with className and source
 */
const ClassDecorator = (opts: ClassDefinitionOptions) => {
    // Get options
    const { className, source } = opts;

    // Return decorator
    return <T extends { new(...args: any[]): Class }>(constructor: T) => {
        // Define class
        class DefinedClass extends constructor {

            static get className() {
                return className || toSnakeCase(constructor.name);
            }

            static get source() {
                return source || this.className;
            }

        }

        // Return defined class
        return DefinedClass;
    };
};

/**
 * Class definition decorator
 * @description Defines and initializes the class
 * @param {String} className
 * @param {String} source
 */
export function define<C extends { new(...args: any[]): Class }>(constructor: C): any;
export function define<C extends { new(...args: any[]): Class }>(opts: ClassDefinitionOptions): (constructor: C) => any;
export function define<C extends { new(...args: any[]): Class }>(...args: [ClassDefinitionOptions] | [C]) {
    if (typeof args[0] !== 'object') {
        const className = toSnakeCase(args[0].name);
        return ClassDecorator({ className })(args[0]);
    } else {
        return ClassDecorator(args[0]);
    }
}

/**
 * Class
 */
export default class Class {

    public identifier: number;
    public keys: KeyMap = new KeyMap;

    /**
     * Constructor
     * @param {Object} params
     * @param {Number} id
     */
    constructor(keys: number | ClassKeys = {}) {
        // Get definition
        const definition = ClassDefinitionManager.get(this.statics());

        // If 'keys' is an id, set the id
        if (typeof keys === 'number') {
            this.identifier = keys;
        } else if (typeof keys === 'object') {
            // Iterate through each param
            for (const [key, value] of Object.entries(keys)) {
                // Check if key exists
                if (!this.statics().has(key))
                    throw new Error(Error.Code.ForbiddenOperation, `Key \`${key}\` does not exist in '${this.statics().className}'`);

                // If the key is an id, set the id
                // Else, set the value
                if (key === InternalId)
                    this.identifier = value;
                else if (definition.guarded.includes(key))
                    throw new Error(Error.Code.ForbiddenOperation, `Key \`${key}\` of \`${this.statics().className}\` cannot be mass assigned because it is guarded`);
                else
                    this[toCamelCase(key)] = value;
            }
        } else throw new Error(Error.Code.ForbiddenOperation, `\`keys\` must be an object or an id`);
    }

    static get className(): string {
        throw new Error(Error.Code.MissingConfiguration,
            'Classes extended from `Class` must define a static getter for className');
    }

    static get source(): string {
        return this.className;
    }

    /**
     * @description Check if provided key exists for the class
     * @param {String} key
     */
    public static has(key: string): boolean {
        // Class definition
        const definition = ClassDefinitionManager.get(this);

        // Check if the key is compound
        if (CompoundKey.isUsedBy(key)) {
            return CompoundKey.from(key).every(k => this.has(k));
        } else if (Relation.isUsedBy(key) && this.hasRelationKey(key)) return true;
        else if (key === InternalKeys.Id) return true;
        else if (definition.timestamps.includes(key)) return true;
        else if (definition.keys.includes(key)) return true;
        else return false;
    }

    public static hasRelationKey(key: string) {
        // Check if key parts are valid
        if (!Relation.isValid(key)) return false;

        // Get source
        const [ sourceClassName, sourceKey ] = Relation.parseKey(key);

        // Get class relation
        const definition = ClassDefinitionManager.get(this);
        const relationDefinition = definition.relations[sourceClassName];

        // Check if relation exists
        if (!(relationDefinition instanceof RelationDefinition)) {
            return false;
        } else {
            // Check if relation has the key
            const relation = relationDefinition.toRelation();
            if (!relation.class.has(sourceKey)) {
                return false;
            }
        }
        return true;
    }

    public static withId<C extends Class>(id: number): C {
        return new this(id) as C;
    }

    public statics<T extends typeof Class>(): T {
        return this.constructor as T;
    }

    get isNew(): boolean {
        return typeof this.identifier === 'undefined';
    }

    get id(): number {
        return this.identifier;
    }

    set id(value: number) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `id` key');
    }

    get createdAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.CreatedAt);
        return keyManager.getter(this.keys.get(keyManager.name));
    }

    set createdAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `createdAt` key');
    }

    get updatedAt(): string {
        const keyManager = DateKey(InternalKeys.Timestamps.UpdatedAt);
        return keyManager.getter(this.keys.get(keyManager.name));
    }

    set updatedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `updatedAt` key');
    }

    set deletedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `deletedAt` key');
    }

    /**
     * toSqlString
     * @description Executed every time the object is being saved to the database
     */
    public toSqlString() {
        return this.id;
    }

    /**
     * toJSON
     * @description Executed every time the object is being stringified to an object literal
     */
    public toJSON<C extends this>(isRelation: boolean = false): ClassJSON<C> {
        // Get keys
        const { id, createdAt, updatedAt } = this;
        const keys = {};
        let body = {};

        // Class definition
        const classDefinition = ClassDefinitionManager.get(this.statics());
        const iterables = classDefinition.keys.filter(key => !classDefinition.hidden.includes(key));

        // Iterate through each key in key map
        for (const key of iterables) {
            // Get value
            let value = this[toCamelCase(key)];

            // Check if key is a relation and has a value
            if (typeof classDefinition.relations[key] !== 'undefined' && value instanceof Class) value = value.toJSON(true);

            // Set value
            keys[key] = value;
        }

        // If class is a relation, use attributes
        if (isRelation) {
            body = {
                type: RelationTypeName,
                [InternalKeys.Relations.ClassName]: this.statics().className,
                [InternalKeys.Relations.Attributes]: Object.keys(keys).length > 0 ? keys : undefined,
            };
        } else body = keys; // Else use the keys as-is

        // Return the object
        return {
            [InternalKeys.Id]: id,
            ...body,
            [InternalKeys.Timestamps.CreatedAt]: createdAt,
            [InternalKeys.Timestamps.UpdatedAt]: updatedAt,
        };
    }
}