import Error from '../../utils/error';
import KeyMap from '../../utils/key-map';
import { toCamelCase, toSnakeCase } from '../../utils/format'; 
import { InternalKeys, InternalId, PointerTypeName } from '../../utils/constants';
import Pointer, { PointerDefinition } from './pointer';
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

        };

        // Set class definition
        const definition: ClassDefinition = {
            keys: [],
            timestamps: Object.values(InternalKeys.Timestamps),
            relations: {},
            triggers: [],
            hidden: [],
            guarded: []
        };

        // Set metadata
        const existingDefinition = Reflect.getMetadata(ClassDefinitionSymbol, DefinedClass.prototype);
        Reflect.defineMetadata(ClassDefinitionSymbol, DefinedClass.prototype, { ...definition, ...existingDefinition });

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
export function define<C extends { new(...args: any[]): Class }>(constructor: C): C;
export function define<C extends { new(...args: any[]): Class }>(opts: ClassDefinitionOptions): C;
export function define<C extends { new(...args: any[]): Class }>(...args: [ClassDefinitionOptions] | [C]) {
    if(typeof args[0] !== 'object') {
        const className = toSnakeCase(args[0].name);
        return ClassDecorator({ className })(args[0]);
    }
    else {
        return ClassDecorator(args[0]);
    }
}

/**
 * Class
 */
export default class Class {

    identifier: number;
    keys: KeyMap = new KeyMap;

    /**
     * Constructor
     * @param {Object} params 
     * @param {Number} id 
     */
    constructor(keys: number | ClassKeys = {}) {
        // If 'keys' is an id, set the id
        if(typeof keys === 'number') {
            this.identifier = keys;
        }
        // If 'keys' is an object, set values
        else if(typeof keys === 'object') {
            // Iterate through each param
            for(let [key, value] of Object.entries(keys)) {
                // Check if key exists
                if(!this.statics().has(key))
                    throw new Error(Error.Code.ForbiddenOperation, `Key \`${key}\` does not exist in '${this.statics().className}'`);
    
                // If the key is an id, set the id
                // Else, set the value
                if(key === InternalId)
                    this.identifier = value;
                else
                    this[toCamelCase(key)] = value;
            }
        }
        else throw new Error(Error.Code.ForbiddenOperation, `\`keys\` must be an object or an id`);
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
    static has(key: string): boolean {
        // Class definition
        const definition = this.prototype.getDefinition();

        // Check if the key is compound
        if(CompoundKey.isUsedBy(key)) {
            return CompoundKey.from(key).every(k => this.has(k));
        }
        // Check if the key is for a pointer
        else if(Pointer.isUsedBy(key) && this.hasPointerKey(key)) return true;
        else if(key === InternalKeys.Id) return true;
        else if(definition.timestamps.includes(key)) return true;
        else if(definition.keys.includes(key)) return true;
        else return false;
    }

    static hasPointerKey(key: string) {
        // Check if key parts are valid
        if(!Pointer.isValid(key)) return false;

        // Get source
        const [ sourceClassName, sourceKey ] = Pointer.parseKey(key);

        // Get class pointer
        const definition = this.prototype.getDefinition();
        const pointerDefinition = definition.relations[sourceClassName];

        // Check if pointer exists
        if(!(pointerDefinition instanceof PointerDefinition)) {
            return false;
        }
        else {
            // Check if pointer has the key
            const pointer = pointerDefinition.toPointer();
            if(!pointer.class.has(sourceKey)) {
                return false;
            }
        }
        return true;
    }

    private hasPointer(key: string) {
        return this.getDefinition().relations[key];
    }

    /**
     * Get class definition
     */
    getDefinition(): ClassDefinition {
        // Get definition
        const definition = Reflect.getMetadata(ClassDefinitionSymbol, this) as ClassDefinition;

        // Override default definition
        return  { ...definition };
    }
    
    statics<T extends typeof Class>(): T {
        return this.constructor as T;
    }

    get isNew(): boolean {
        return typeof this.identifier !== 'undefined';
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
    toSqlString() {
        return this.id;
    }

    /**
     * toJSON
     * @description Executed every time the object is being stringified to an object literal
     */
    toJSON<C extends this>(isPointer: boolean = false): ClassJSON<C> {
        // Get keys
        const { id, createdAt, updatedAt } = this;
        let keys = {};
        let body = {};

        // Class definition
        const classDefinition = this.getDefinition();
        const iterables = classDefinition.keys.filter(key => !classDefinition.hidden.includes(key));

        // Iterate through each key in key map
        for(let key of iterables) {
            // Get value
            let value = this[toCamelCase(key)];

            // Check if key is a pointer and has a value
            if(typeof classDefinition.relations[key] !== 'undefined' && value instanceof Class) value = value.toJSON(true);

            // Set value
            keys[key] = value;
        }

        // If class is a pointer, use attributes
        if(isPointer) {
            body = { 
                type: PointerTypeName,
                [InternalKeys.Pointers.ClassName]: this.statics().className,
                [InternalKeys.Pointers.Attributes]: Object.keys(keys).length > 0 ? keys : undefined
            };
        }
        else body = keys; // Else use the keys as-is

        // Return the object
        return {
            [InternalKeys.Id]: id,
            ...body,
            [InternalKeys.Timestamps.CreatedAt]: createdAt,
            [InternalKeys.Timestamps.UpdatedAt]: updatedAt
        };
    }
}