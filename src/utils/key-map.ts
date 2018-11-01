import Error from './error';

class KeyValuePair {

    /**
     * Private properties
     */
    _key: string;
    _value: any;

    /**
     * Constructor
     * @param {String} key
     * @param {*} value
     * @param {String} key
     */
    constructor(key: string, value: any) {
        // Set values
        this._key = key;
        this._value = value;
    }

    get key(): string {
        return this._key;
    }

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
    }
}

export { KeyValuePair };

export default class KeyMap {

    /**
     * Private properties
     */
    _map: {[key: string]: KeyValuePair} = {};
    _immutable: boolean;

    /**
     * Constructor
     * @param {Object} keyValuePairs
     * @param {Boolean} immutable
     */
    constructor(keyValuePairs: {[key: string]: any} = {}, immutable: boolean = false) {
        // Populate map
        for(let key in keyValuePairs) {
            let value = keyValuePairs[key];
            let keyValuePair = new KeyValuePair(key, value);
            this._map[key] = keyValuePair;
        }

        // Set immutability
        this._immutable = immutable;
    }

    get length() {
        return Object.keys(this._map).length;
    }

    set(key: string, value: any): void {
        // Check if immutable
        if(this._immutable)    
            throw new Error(Error.Code.ForbiddenOperation, 'Cannot set a value for an immutable KeyMap');       
        
        // Check if key exists
        if(typeof this._map[key] === 'undefined')
            this._map[key] = new KeyValuePair(key, value);
        else
            // Set value for the keyValuePair
            this._map[key].value = value;
    }

    remove(key: string): void {
        // Check if immutable
        if(this._immutable) 
            throw new Error(Error.Code.ForbiddenOperation, 'Cannot remove from an immutable KeyMap');  

        // Remove the key from the map
        delete this._map[key];
    }

    get(key: string): any {
        // Get the value for the keyValuePair
        if(typeof this._map[key] === 'undefined')
            this._map[key] = new KeyValuePair(key, undefined);

        // Return the value
        return this._map[key].value;
    }

    getKeys() {
        return Object.keys(this._map);
    }

    has(key: string) {
        return typeof this._map[key] !== 'undefined';
    }

    toList(): Array<KeyValuePair> {
        return this.getKeys().map(key => this._map[key]);
    }

    setImmutability(immutability: boolean) {
        this._immutable = immutability;
    }

    toJSON(): Object {
        const json = this.toList().reduce((map, keyValuePair) => {
            map[keyValuePair.key] = keyValuePair.value;
            return map;
        }, {});

        if(this._immutable)
            return Object.freeze(json);
        return json;
    }
}