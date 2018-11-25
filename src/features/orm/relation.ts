import Class, { ClassDefinitionManager } from './class';
import { InternalKeys, RelationDelimiter, RelationTypeName } from '../../utils/constants';
import { toSnakeCase } from '../../utils/format';
import Error from '../../utils/error';
import RelationKey from './keys/types/relation';
import { ClassCaller } from '../../types/relations';
import { Query } from '../..';

export default class Relation {

    public sourceClassName: string;
    public sourceKey: string;
    public classType: typeof Class;
    public parentClassName: string;
    public parentKey: string;
    private secondaryFlag: boolean;

    /**
     * Constructor
     * @param {Class} classType
     * @param {String} aliasKey
     */
    constructor(
        classType: typeof Class,
        sourceClassName: string,
        sourceKey: string,
        parentClassName: string,
        parentKey: string,
        secondary: boolean = false,
    ) {
        this.classType = classType;
        this.sourceClassName = sourceClassName;
        this.sourceKey = sourceKey;
        this.parentClassName = parentClassName;
        this.parentKey = parentKey;
        this.secondaryFlag = secondary;
    }

    public static isUsedBy(key: string) {
        return key.indexOf(RelationDelimiter) > 0;
    }

    public static isValid(key: string) {
        return this.isUsedBy(key) && key.split(RelationDelimiter).length === 2;
    }

    public static parseKey(keyName: string): [string, string] {
        // Get key parts
        const [ className, key ] = keyName.split(RelationDelimiter, 2);

        return [ className, key ];
    }

    public static formatKey(className: string, key: string) {
        return `${className}${RelationDelimiter}${key}`;
    }

    public static formatAsId(key: string) {
        return `${key}_${InternalKeys.Id}`;
    }

    public statics() {
        return this.constructor as typeof Relation;
    }

    get class(): typeof Class {
        return this.classType;
    }

    get secondary(): boolean {
        return this.secondaryFlag;
    }

    /**
     * The foreign key inside the current class
     */
    public sourceClassKey(className: string): string {
        const sourceClass = this.sourceClassName !== RelationDefinition.OwnerSymbol ? this.sourceClassName : className;
        return this.statics().formatKey(sourceClass, this.sourceKey);
    }

    /**
     * The key inside the other class that the foreign key matches
     */
    public parentClassKey(): string {
        return this.statics().formatKey(this.parentClassName, this.parentKey);
    }

    public isImplementedBy(value: object) {
        if (value === null) return true;
        if (typeof value !== 'object') return false;
        if (value[InternalKeys.Relations.Type] !== RelationTypeName) return false;
        if (value[InternalKeys.Relations.ClassName] !== this.class.className) return false;
        if (value[InternalKeys.Id] === null || typeof value[InternalKeys.Id] === 'undefined') return false;
        return true;
    }
}

export class RelationDefinition<C extends typeof Class> {

    private classCaller: ClassCaller<C>;
    private sourceClassName: string;
    private sourceKey: string;
    private parentClassName: string;
    private parentKey: string;

    public static OwnerSymbol = '*';

    constructor(
        classDefinition: ClassCaller<C>,
        sourceClassName: string,
        sourceKey: string,
        parentClassName: string,
        parentKey: string,
    ) {
        this.classCaller = classDefinition;
        this.sourceClassName = sourceClassName;
        this.sourceKey = sourceKey;
        this.parentClassName = parentClassName;
        this.parentKey = parentKey;
    }

    public toRelation() {
        const classType = this.classCaller();
        const definition = ClassDefinitionManager.get(classType);
        const { sourceClassName, sourceKey, parentClassName, parentKey } = this;
        let actualSourceKey = sourceKey;
        let secondary = false;

        // Check if source is the owner
        if (sourceClassName !== RelationDefinition.OwnerSymbol) secondary = true;

        // Check if relation is secondary
        if (secondary) {
            if (typeof definition.relations[sourceKey] !== 'undefined') {
                // Get parent definition
                const parentDefinition = definition.relations[sourceKey];
                actualSourceKey = parentDefinition.toRelation().sourceKey;
            } else throw new Error(Error.Code.ForbiddenOperation, `Relation \`${this.sourceKey}\` does not exist in ${sourceClassName}`);
        }

        // Create a relation
        const relation = new Relation(
            classType,
            sourceClassName,
            actualSourceKey,
            parentClassName,
            parentKey,
            secondary,
        );

        // Return relation
        return relation;
    }
}

/**
 * belongsTo decorator for relations
 * @param classCaller
 */
export const belongsTo = <C extends typeof Class>(classCaller: ClassCaller<C>, from?: string, to?: string) => {
    return <T extends Class>(classInstance: T, name: string): any => {
        // Get relation name
        const keyName = toSnakeCase(name);

        // Set default values
        from = from || Relation.formatKey(RelationDefinition.OwnerSymbol, Relation.formatAsId(keyName));
        to = to || Relation.formatKey(keyName, InternalKeys.Id);

        // Extract keys
        const [ sourceClassName, sourceKey ] = Relation.parseKey(from);
        const [ parentClassName, parentKey ] = Relation.parseKey(to);

        // Prepare relation definition
        const relationDefinition = new RelationDefinition(classCaller, sourceClassName, sourceKey, parentClassName, parentKey);

        // Prepare key manager
        const keyManager = RelationKey(keyName, relationDefinition);

        // Set definition
        const definition = ClassDefinitionManager.get(classInstance.statics());
        definition.relations[keyName] = relationDefinition;
        ClassDefinitionManager.set(classInstance.statics(), definition);
    };
};

/**
 * hasMany decorator for relations
 * @param classCaller
 * @param key
 */
export const hasMany = <C extends typeof Class>(classCaller: ClassCaller<C>, key?: string) => {
    return <T extends Class>(classInstance: T, name: string): any => {
        // Override getter and setter
        Object.defineProperty(classInstance, name, {
            set(value) {
                throw new Error(Error.Code.ForbiddenOperation, 'Cannot set the value of a `hasMany` relation');
            },
            get() {
                if (this.isNew) throw new Error(Error.Code.ForbiddenOperation, 'Cannot get a `hasMany` relation for a new object');
                const relationKey: string = Relation.formatKey(this.statics().className, InternalKeys.Id);
                key = key || relationKey;
                return new Query(classCaller()).equalTo(key, this.id);
            },
            enumerable: true,
            configurable: true,
        });
    };
};