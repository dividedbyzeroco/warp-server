import { Warp } from 'warp-sdk-js';
import Key, { KeyManager, keyIsImplementedBy } from './key';
import Error from '../utils/error';
import KeyMap from '../utils/key-map';
import { toCamelCase, toISODate } from '../utils/format';
import { InternalKeys } from '../utils/constants';
import ModelCollection from '../utils/model-collection';
import ConstraintMap from '../utils/constraint-map';
import { IDatabaseAdapter } from '../types/database';
import { FindOptionsType, SubqueryOptionsType } from '../types/database';
import { ModelOptionsType, MetadataType, QueryOptionsType, QueryGetOptionsType, PointerObjectType, IPointer } from '../types/model';
import { getPropertyDescriptor } from '../utils/props';
import { IKeyManager } from '../types/key';

export class Pointer implements IPointer {

    _model: typeof ModelClass;
    _aliasKey: string;
    _viaKey: string;
    _pointerIdKey: string = InternalKeys.Id;
    _isSecondary: boolean = false;
    _parentAliasKey: string;
    _parentViaKey: string;

    /**
     * Constructor
     * @param {ModelClass} model 
     * @param {String} key 
     */
    constructor(model: typeof ModelClass, key: string) {
        this._model = model;
        this._aliasKey = key;
        this._viaKey = `${this._aliasKey}_${InternalKeys.Id}`;
    }
    
    static get Delimiter(): string {
        return '.';
    }

    static get IdDelimiter(): string {
        return ':';
    }

    static isUsedBy(key: string) {
        return key.indexOf(this.Delimiter) > 0;
    }

    static isUsedAsIdBy(key: string) {
        return key.indexOf(this.IdDelimiter) > 0;
    }

    static validateKey(key: string, model: typeof ModelClass) {
        // Get key parts
        const keyParts = key.split(this.Delimiter);

        // Check if key parts are valid
        if(keyParts.length !== 2) {
            throw new Error(Error.Code.ForbiddenOperation, `The key \`${key}\` is invalid`);
        }

        // Get alias and key
        const alias = keyParts[0];
        const pointerKey = keyParts[1];

        // Get model pointer
        const pointer = model._keys[alias];

        // Validate className and key
        if(!(pointer instanceof this)) {
            throw new Error(Error.Code.MissingConfiguration, `The pointer for \`${key}\` does not exist`);
        }
        else if(
            (typeof pointer.model._keys[pointerKey] !== 'string' 
                && !pointer.model._timestamps[pointerKey]
                && InternalKeys.Id !== pointerKey)
            || typeof pointer.model._hidden[pointerKey] === 'string') {
            throw new Error(Error.Code.ForbiddenOperation, `The pointer key for \`${key}\` does not exist or is hidden`);
        }
    }

    static getAliasFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.Delimiter);

        // Return the first key part
        return keyParts[0];
    }

    static getPointerIdKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.IdDelimiter);

        // Return the first key part
        return keyParts[0];
    }

    static getKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.Delimiter);

        // Return the first key part
        return keyParts[1];
    }

    static getViaKeyFrom(key: string) {
        // Get key parts
        const keyParts = key.split(this.IdDelimiter);

        // Return the first key part
        return keyParts[1];
    }

    get statics() {
        return this.constructor as typeof Pointer;
    }

    get model(): typeof ModelClass {
        return this._model;
    }

    get aliasKey(): string {
        return this._aliasKey;
    }

    get viaKey(): string {
        return this._viaKey;
    }

    get pointerIdKey(): string {
        return `${this.aliasKey}${this.statics.Delimiter}${this._pointerIdKey}`;
    }

    get isSecondary(): boolean {
        return this._isSecondary;
    }

    get parentAliasKey(): string {
        return this._parentAliasKey;
    }

    get parentViaKey(): string {
        return this._parentViaKey;
    }

    via(key: string): this {
        this._viaKey = key;
        return this;
    }

    to(key: string): this {
        this._pointerIdKey = key;
        return this;
    }

    from(key: string): this {
        // Check if key is for a pointer
        if(!this.statics.isUsedBy(key))
            throw new Error(Error.Code.ForbiddenOperation, `Secondary key \`key\` must be a pointer to an existing key`);

        // Set new via key and set isSecondary to true
        this._parentAliasKey = this.statics.getAliasFrom(key);
        this._parentViaKey = this.statics.getKeyFrom(key); 
        this.via(`${this.parentAliasKey}${this.statics.Delimiter}${this.parentViaKey}_${InternalKeys.Id}`);
        this._isSecondary = true;
        
        return this;
    }

    isImplementedBy(value: object) {
        if(value === null) return true;
        if(typeof value !== 'object') return false;
        if(value['type'] !== 'Pointer') return false;
        if((this.model.supportLegacy && value[InternalKeys.Pointers.LegacyClassName] !== this.model.className) 
            || (!this.model.supportLegacy && value[InternalKeys.Pointers.ClassName] !== this.model.className)) return false;
        if(value['id'] <= 0) return false;
        return true;
    }

    toObject(value?: number | object): PointerObjectType | null {
        // Check if value exists
        if(!value) return null;

        // If value is a number
        if(typeof value === 'number') {
            // Otherwise, return a pointer object
            return {
                type: 'Pointer',
                [this.model.supportLegacy? 
                    InternalKeys.Pointers.LegacyClassName 
                    : InternalKeys.Pointers.ClassName]: this.model.className,
                id: value
            };
        }
        else if(typeof value === 'object') {    
            // Get key values
            const id = value[InternalKeys.Id];
            const createdAt = value[InternalKeys.Timestamps.CreatedAt];
            const updatedAt = value[InternalKeys.Timestamps.UpdatedAt];
            const attributes = value[InternalKeys.Pointers.Attributes];
            const modelClass = this.model;
            const model = new modelClass({ id, keyMap: new KeyMap(attributes), createdAt, updatedAt, isPointer: true });

            // Return a pointer object
            return model.toJSON() as PointerObjectType;
        }
        else return null;
    }
}

export class ModelClass {

    static _database: IDatabaseAdapter;
    static _supportLegacy: boolean = false;
    static _keys: {[name: string]: any};
    static _joins: {[name: string]: Pointer};
    static _hidden: {[name: string]: string};
    static _protected: {[name: string]: string};
    static _timestamps: {[name: string]: boolean};
    _warp: Warp;
    _metadata: MetadataType;
    _currentUser: any;
    _isNew: boolean = true;
    _id: number;
    _keyMap: KeyMap = new KeyMap();
    _isPointer: boolean;

    /**
     * Constructor
     * @param {Object} params 
     * @param {Number} id 
     */
    constructor({ metadata, currentUser, keys = {}, keyMap, id, createdAt, updatedAt, isPointer = false }: ModelOptionsType = {}) {
        // If metadata exists, save it
        if(typeof metadata !== 'undefined') this._metadata = metadata;

        // If current user exists, save it
        if(typeof currentUser !== 'undefined') this._currentUser = currentUser;

        // Iterate through each param
        for(let key in keys) {
            // Get value
            let value = keys[key];

            // Check if setter exists
            const keyDescriptor = getPropertyDescriptor(this, toCamelCase(key));
            if(typeof keyDescriptor !== 'undefined' && typeof keyDescriptor.set === 'function') {
                try {
                    const setter = keyDescriptor.set.bind(this);
                    setter(value);
                }
                catch(err) {
                    throw new Error(Error.Code.InvalidObjectKey, err.message);
                }
            }
            // Otherwise, generically set the value
            else this.set(key, value);
        }

        // If key map exists, override the existing key map
        if(typeof keyMap !== 'undefined') this._keyMap = keyMap;

        // If id exists, save it and toggle off the isNew flag
        if(typeof id !== 'undefined') {
            this._id = id;
            this._isNew = false;
        }

        // If timestamps exist, save them
        if(typeof createdAt !== 'undefined') this._keyMap.set(InternalKeys.Timestamps.CreatedAt, createdAt);
        if(typeof updatedAt !== 'undefined') this._keyMap.set(InternalKeys.Timestamps.UpdatedAt, updatedAt);

        // Check if model is a pointer
        this._isPointer = isPointer;
    }

    /**
     * Initialize
     * @description Function that must be invoked once
     * in order to initialize the model
     * @param {IDatabaseAdapter} database
     * @returns {WarpServer}
     */
    static initialize<T extends typeof ModelClass>(database: IDatabaseAdapter, supportLegacy: boolean = false): T {
        // Set database
        this._database = database;
        this._supportLegacy = supportLegacy;

        // Prepare joins
        this._joins = {};

        // Prepare key definitions
        this._keys = this.keys.reduce((map, key) => {
            // Check if key is a string
            if(typeof key === 'string') {
                // Check if key is in valid snake_case format
                if(!(/^[a-z]+(_[a-z]+)*$/).test(key)) {
                    throw new Error(Error.Code.ForbiddenOperation, 
                        `Keys defined in models must be in snake_case format: ${this.className}.${key}`);
                }

                // Set the key
                map[key] = key;
            }
            // Else, if it is a pointer
            else if(key instanceof Pointer) {
                // Use the alias key
                map[key.aliasKey] = key;

                // If it is a secondary key, check if parent and via keys exist
                if(key.isSecondary) {
                    const parentJoin = this._joins[key.parentAliasKey];
                    if(typeof parentJoin === 'undefined')
                        throw new Error(Error.Code.MissingConfiguration, 
                            `Parent pointer \`${key.parentAliasKey}\` of \`${key.aliasKey}\` does not exist`);

                    if(!parentJoin.model._keyExists(key.parentViaKey))
                        throw new Error(Error.Code.MissingConfiguration, 
                            `Parent pointer key \`${key.parentAliasKey}${Pointer.Delimiter}${key.parentViaKey}\` of \`${key.aliasKey}\` does not exist`);
                }

                // Add the pointer to joins
                this._joins[key.aliasKey] = key;

                // Override pointer getter and setter
                const pointerDescriptor = Object.getOwnPropertyDescriptor(this.prototype, toCamelCase(key.aliasKey));

                // If pointer descriptor doesn't exist
                if(typeof pointerDescriptor === 'undefined') {
                    Object.defineProperty(this.prototype, toCamelCase(key.aliasKey), {
                        set(value) {
                            if(key.isSecondary)
                                throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set secondary pointers`);
                            if(!key.isImplementedBy(value))
                                throw new Error(Error.Code.ForbiddenOperation, 
                                    `Key \`${key.aliasKey}\` must be a pointer to \`${key.model.className}\``);

                            // Set the via key value and alias
                            this._keyMap.set(key.viaKey, value? value.id : null);
                            this._keyMap.setAlias(key.viaKey, key.aliasKey);
                        },
                        get() {
                            // Retrieve the via key value
                            const value = this._keyMap.get(key.viaKey);

                            // If value is null, return null
                            if(value === null) return null;
                            if(typeof value === 'object' && value.id === null) return null;

                            // Get the pointer key object
                            return key.toObject(value);
                        }
                    });
                }
            }
            // Else, if it is a key manager
            else if(key instanceof KeyManager) {
                // Use the name of the key
                map[key.name] = key.name;

                // Override pointer getter and setter
                const keyDescriptor = Object.getOwnPropertyDescriptor(this.prototype, toCamelCase(key.name));

                // If key descriptor doesn't exist
                if(typeof keyDescriptor === 'undefined') { 
                    Object.defineProperty(this.prototype, toCamelCase(key.name), {
                        set(value) {
                            value = key.setter(value);
                            this._keyMap.set(key.name, value);
                        },
                        get() {
                            return key.getter(this._keyMap.get(key.name));
                        }
                    });
                }
            }
            else {
                throw new Error(Error.Code.MissingConfiguration, `Key \`${key}\` must either be a string, a Pointer or a Key`);
            }
            
            // Return the map
            return map;
        }, {});

        // Prepare hidden keys
        this._hidden = this.hidden.reduce((map, key) => {
            // Check if the key exists
            if(typeof this._keys[key] === 'undefined')
                throw new Error(Error.Code.MissingConfiguration, `Hidden key \`${this.className}.${key}\` does not exist in keys`);

            // Set the key
            map[key] = key;
            return map;
        }, {});

        // Prepare protected keys
        this._protected = this.protected.reduce((map, key) => {
            // Check if the key exists
            if(typeof this._keys[key] === 'undefined')
                throw new Error(Error.Code.MissingConfiguration, `Protected key \`${this.className}.${key}\` does not exist in keys`);

            // Set the key
            map[key] = key;
            return map;
        }, {});

        // Prepare timestamp keys
        this._timestamps = {
            [InternalKeys.Timestamps.CreatedAt]: true,
            [InternalKeys.Timestamps.UpdatedAt]: true,
            [InternalKeys.Timestamps.DeletedAt]: true
        };

        return this as T;
    }

    static get isModel(): boolean {
        return true;
    }

    static get className(): string {
        throw new Error(Error.Code.MissingConfiguration, 
            'Models extended from `Model.Class` must define a static getter for className');
    }

    static get source(): string {
        return this.className;
    }

    static get keys(): Array<string | IPointer | IKeyManager> {
        return [];
    }

    static get hidden(): Array<string> {
        return [];
    }

    static get protected(): Array<string> {
        return [];
    }

    static get supportLegacy(): boolean {
        return this._supportLegacy;
    }

    static _keyExists(key: string) {
        // Check if the constraint is for a pointer
        if(Pointer.isUsedBy(key)) {
            // Validate pointer key
            Pointer.validateKey(key, this);
            return true;
        }
        else if(key === InternalKeys.Id) return true;
        else if(this._timestamps[key]) return true;
        else if(typeof this._keys[key] === 'undefined') return false;
        else return true;
    }

    static _getQueryKeys(select: Array<string>, include: Array<string>) {
        // Get parameters
        const keys: Array<string> = [];
        const includedJoins = {};

        // Check if select parameter is provided
        if(select.length === 0) {
            select = [InternalKeys.Id]
                .concat(Object.keys(this._keys))
                .concat([InternalKeys.Timestamps.CreatedAt, InternalKeys.Timestamps.UpdatedAt]);
        }

        // Iterate through the selected keys
        for(let key of select) {
            // If the key is an internal key
            if(key === InternalKeys.Id || this._timestamps[key]) {
                // Push the key
                keys.push(key);
            }
            // If it is a pointer key
            else if(Pointer.isUsedBy(key)) {
                // Move it to the include list
                include.push(key);
            }
            // If the key exists
            else if(typeof this._keys[key] !== 'undefined') {
                // Get key name
                const keyName = this._keys[key];
                
                // If they key provided is a pointer
                if(keyName instanceof Pointer) {
                    // If the pointer is secondary
                    if(keyName.isSecondary) {
                        // Move it to the include list
                        include.push(keyName.pointerIdKey);
                    }
                    else {
                        // Use the via key
                        keys.push(`${keyName.pointerIdKey}${Pointer.IdDelimiter}${keyName.viaKey}`);
                    }
                }
                else keys.push(key);
            }
            else
                throw new Error(Error.Code.ForbiddenOperation, `Select key \`${key}\` does not exist in \`${this.className}\``);
        }
        
        // Check include keys
        for(let key of include) {
            // Validate key
            Pointer.validateKey(key, this);

            // Add it to the select keys and included joins
            keys.push(key);
            includedJoins[Pointer.getAliasFrom(key)] = true;

            // If the key is from a secondary join, add the parent join
            const join = this._joins[Pointer.getAliasFrom(key)];
            if(join.isSecondary) {
                includedJoins[join.parentAliasKey] = true;
            }
        }

        // Create joins
        const joins = Object.keys(this._joins).reduce((map, key) => {
            // Get join 
            const join = this._joins[key];
            map[key] = { join, included: includedJoins[key] };
            return map;
        }, {});

        return { keys, joins };
    }

    static _checkQueryConstraints(where: ConstraintMap, classAlias: string): void {
        // Check where constraints
        for(let key of where.getKeys()) {
            // Check if key exists
            if(!this._keyExists(key))
                throw new Error(Error.Code.ForbiddenOperation, `The constraint key \`${key}\` does not exist`);

            // Check if the key is an id for a pointer
            if(Model.Pointer.isUsedBy(key)) {
                // Get alias and join
                const alias = Model.Pointer.getAliasFrom(key);
                const join = this._joins[alias];

                // Check if join exists
                if(alias !== this.className && key === join.pointerIdKey) {
                    // If alias is not the main class and key is a pointer id, use the via key
                    where.changeKey(key, `${classAlias}${Pointer.Delimiter}${join.viaKey}`);
                }
            }
            else where.changeKey(key, `${classAlias}${Pointer.Delimiter}${key}`);
        }
    }

    static _getQuerySorting(sort: Array<string | object>): Array<string> {
        // Prepare sorting
        const sorting: Array<string> = [];

        // Iterate through each sort
        for(let key of sort) {
            // If the key is an object (legacy version)
            if(typeof key === 'object') {
                // Validate key
                if(Object.keys(key).length !== 1 || Math.abs(key[Object.keys(key)[0]]) !== 1)
                    throw new Error(Error.Code.ForbiddenOperation, 'The sort key provided must be a string or { KEY_NAME: 1 | -1 }');

                // Get sorting parts
                const keyName = Object.keys(key)[0];
                const keyOrder = key[keyName];

                // Convert to string
                key = `${keyOrder < 0? '-' : ''}${keyName}`;
            }

            // Check if key exists
            if(!this._keyExists(key.replace('-', '')))
                throw new Error(Error.Code.ForbiddenOperation, `The sort key \`${key}\` does not exist`);

            // Add className to sort key if it is not a pointer
            if(!Pointer.isUsedBy(key))
                key = `${key.indexOf('-') >= 0? '-' : ''}${this.className}.${key.replace('-', '')}`;
            
            // Push the key
            sorting.push(key);
        }

        return sorting;
    }

    static _getQueryModel<T extends ModelClass>(keys: KeyMap): T {
        // Get internal keys
        const id = keys.get(InternalKeys.Id);
        const createdAt = keys.get(InternalKeys.Timestamps.CreatedAt);
        const updatedAt = keys.get(InternalKeys.Timestamps.UpdatedAt);

        // Remove id from the key map
        keys.remove(InternalKeys.Id);

        // Return the new model
        return <T>(new this({ metadata: { isMaster: true }, keyMap: keys, id, createdAt, updatedAt }));
    }

    /**
     * Get subquery
     */
    static getSubquery({ where, select }: SubqueryOptionsType): FindOptionsType {
        // Get class alias
        const classAlias = `subquery_${this.className}`;

        // Get subquery constraints
        const constraints = new ConstraintMap(where);
        
        // Get query keys
        const { keys, joins } = this._getQueryKeys([select], []);

        // Check constraints
        this._checkQueryConstraints(constraints, classAlias);

        // Return subquery
        return {
            classAlias,
            source: this.source,
            select: keys,
            joins,
            where: constraints
        };
    }
    
    /**
     * Find matching objects
     */
    static async find<T extends ModelClass>({ 
        select = [], 
        include = [], 
        where, 
        sort = [InternalKeys.Id], 
        skip,
        limit 
    }: QueryOptionsType): Promise<ModelCollection<T>> {
        // Get keys
        const { keys, joins } = this._getQueryKeys(select, include);
    
        // Check where constraints
        this._checkQueryConstraints(where, this.className);

        // Get sorting
        const sorting = this._getQuerySorting(sort);

        // Execute find
        const result = await this._database.find(
            this.source, 
            this.className, 
            keys, 
            joins,
            where,
            sorting, 
            skip, 
            limit
        );

        // Return result
        const rows: T[] = [];
        for(let row of result) {
            // Push the row
            rows.push(this._getQueryModel<T>(row));
        }
        return new ModelCollection(rows);
    }

    /**
     * Find a single object
     */
    static async getById<T extends ModelClass>({ select = [], include = [], id }: QueryGetOptionsType): Promise<T | void> {
        // Get parameters
        const { keys, joins } = this._getQueryKeys(select, include);

        // Execute first
        const result = await this._database.get(
            this.source, 
            this.className, 
            keys, 
            joins,
            id
        );

        // Return result
        if(!result) return;

        return this._getQueryModel<T>(result);
    }
    
    /**
     * @description Create a pointer
     * @param {string} key 
     * @returns {WarpServer.Pointer}
     */
    static as(key: string): Pointer {
        return new Pointer(this, key);
    }
    
    statics<T extends typeof ModelClass>(): T {
        return this.constructor as T;
    }

    get Warp(): Warp {
        return this._warp;
    }

    get isNew(): boolean {
        return this._isNew;
    }

    get id(): number {
        return this._id;
    }

    get currentUser(): any {
        return this._currentUser;
    }

    get createdAt(): string {
        const dateTime = this._keyMap.get(InternalKeys.Timestamps.CreatedAt);
        if(typeof dateTime === 'undefined' || dateTime === null) return dateTime;
        else return toISODate(dateTime);
    }

    get updatedAt(): string {
        const dateTime = this._keyMap.get(InternalKeys.Timestamps.UpdatedAt);
        if(typeof dateTime === 'undefined' || dateTime === null) return dateTime;
        else return toISODate(dateTime);
    }

    get deletedAt(): string {
        const dateTime = this._keyMap.get(InternalKeys.Timestamps.DeletedAt);
        if(typeof dateTime === 'undefined' || dateTime === null) return dateTime;
        else return toISODate(dateTime);
    }

    set id(value: number) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `id` key');
    }

    set createdAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `createdAt` key');
    }

    set updatedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `updatedAt` key');
    }

    set deletedAt(value: string) {
        throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `deletedAt` key');
    }

    get sessionToken(): string | void {
        return this._metadata.sessionToken;
    }

    get appClient(): string | void {
        return this._metadata.client;
    }

    get appVersion(): string | void {
        return this._metadata.appVersion;
    }

    get sdkVersion(): string | void {
        return this._metadata.sdkVersion;
    }

    get isMaster(): boolean {
        return !!this._metadata.isMaster;
    }

    /**
     * Generic setter for all keys
     * @param {String} key 
     * @param {*} value 
     */
    set(key: string, value: any) {
        // Check the key
        if(this.statics()._protected[key] && !this.isMaster) {
            // If it is a protected key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set \`${key}\` because it is a protected key`);
        }
        else if(InternalKeys.Id === key || this.statics()._timestamps[key]) {
            // If it is an internal key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually set \`${key}\` because it is an internal key`);
        }
        else if(this.statics()._keys[key] instanceof Pointer) {
            // If the key is a pointer
            throw new Error(Error.Code.ForbiddenOperation, `Cannot use the generic \`set\` method for pointers (use the pointer setter instead)`);
        }
        else if(typeof this.statics()._keys[key] !== 'undefined') {
            // If the key exists
            this._keyMap.set(key, value);
        }
        else {
            // Otherwise, return an error
            throw new Error(Error.Code.InvalidObjectKey, `Key \`${key}\` does not exist for \`${this.statics().className}\``);
        }
    }

    /**
     * Generic getter for all keys
     * @param {String} key 
     * @param {*} value 
     */
    get(key: string): any {
        // Check the key
        if(this.statics()._hidden[key] && !this.isMaster) {
            // If it is a hidden key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually get \`${key}\` because it is a hidden key`);
        }
        else if(InternalKeys.Id === key || this.statics()._timestamps[key]) {
            // If it is an internal key
            throw new Error(Error.Code.ForbiddenOperation, `Cannot manually get \`${key}\` because it is an internal key`);
        }
        else if(this.statics()._keys[key] instanceof Pointer) {
            // If the key is a pointer
            throw new Error(Error.Code.ForbiddenOperation, `Cannot use the generic \`get\` method for pointers (use \`this.${key}\` instead)`);
        }

        // Otherwise, get the KeyMap value
        return this._keyMap.get(key);
    }

    /**
     * toPointer
     * @description Convert the model object into a pointer
     */
    toPointer() {
        // Convert the model object into a pointer
        this._isPointer = true;
    }

    /**
     * toJSON
     * @description Executed every time the object is stringified
     */
    toJSON(): object {
        // Get keys
        const { id, createdAt, updatedAt, deletedAt } = this;
        let keys = {};

        // Iterate through each key in key map
        for(let key of this._keyMap.getAliases()) {
            // If the key is a timestamp, skip it
            if(InternalKeys.Timestamps.CreatedAt === key 
                || InternalKeys.Timestamps.UpdatedAt === key
                || InternalKeys.Timestamps.DeletedAt === key)
                continue;

            // If the key is hidden, skip it
            if(this.statics()._hidden[key])
                continue;

            // Get the key descriptor
            const keyDescriptor = getPropertyDescriptor(this, toCamelCase(key));

            // Check if key descriptor exists
            if(typeof keyDescriptor !== 'undefined' && typeof keyDescriptor.get === 'function') {
                const getter = keyDescriptor.get.bind(this);
                keys[key] = getter();
            }
            else
                keys[key] = this.get(key);
        }

        // If model is a pointer, use attributes
        if(this._isPointer) 
            keys = { 
                type: 'Pointer',
                [this.statics().supportLegacy? InternalKeys.Pointers.LegacyClassName
                    : InternalKeys.Pointers.ClassName]: this.statics().className,
                [InternalKeys.Pointers.Attributes]: Object.keys(keys).length > 0 ? keys : undefined
            };

        // Return the object
        return {
            [InternalKeys.Id]: id,
            ...keys,
            [InternalKeys.Timestamps.CreatedAt]: createdAt,
            [InternalKeys.Timestamps.UpdatedAt]: updatedAt,
            [InternalKeys.Timestamps.DeletedAt]: deletedAt
        };
    }

    bindSDK(warp: Warp) {
        this._warp = warp;
    }

    async runAsMaster(enclosed: () => Promise<any>) {
        // Get original isMaster status
        const isMaster = this.isMaster;
        
        // Set current isMaster status to true for beforeSave
        this._metadata.isMaster = true;

        // Run the enclosed function
        await enclosed();

        // Return to the original isMaster status
        this._metadata.isMaster = isMaster;
    }

    /**
     * Save the object
     */
    async save(): Promise<void> {
        // Run beforeSave as master
        await this.runAsMaster(this.beforeSave.bind(this));

        // Get keys to save
        const keys = this._keyMap;

        // If the object is new
        if(this.isNew) {
            // Execute create query and retrieve the new id
            this._id = await this.statics()._database.create(this.statics().className, keys);
        }
        else {
            // Execute update query
            await this.statics()._database.update(this.statics().className, keys, this.id);
        }

        // Run the afterSave method in the background as master
        try { this.runAsMaster(this.afterSave.bind(this)); } catch(err) { /* Do nothing */ }

        // Return immediately
        return;
    }

    /**
     * Destroy the object
     */
    async destroy(): Promise<void> {
        // Run beforeDestroy
        await this.runAsMaster(this.beforeDestroy.bind(this));

        // Get keys
        const keys = this._keyMap;

        // Execute destroy query
        await this.statics()._database.destroy(this.statics().className, keys, this.id);

        // Run the afterDestroy method in the background
        try { this.runAsMaster(this.afterDestroy.bind(this)); } catch(err) { /* Do nothing */ }

        // Return immediately
        return;
    }

    async beforeFind() {
        return;
    }

    async beforeSave() {
        return;
    }

    async afterSave() {
        return;
    }

    async beforeDestroy() {
        return;
    }

    async afterDestroy() {
        return;
    }
}

export default class Model {

    static get Class(): typeof ModelClass {
        return ModelClass;
    }

    static get Pointer(): typeof Pointer {
        return Pointer;
    }
}