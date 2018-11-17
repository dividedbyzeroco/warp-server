import Error from './error';

export default class KeyMap {

    /**
     * Private properties
     */
    private map: Map<string, any> = new Map([]);
    private immutable: boolean;

    /**
     * Constructor
     * @param {Object} keyValues
     * @param {Boolean} immutable
     */
    constructor(keyValues: { [key: string]: any } = {}, immutable: boolean = false) {
        // Populate map
        this.map = new Map(Object.entries(keyValues));

        // Set immutability
        this.immutable = immutable;
    }

    get length() {
        return Object.keys(this.map).length;
    }

    get keys() {
        return [ ...this.map.keys() ];
    }

    get values() {
        return [ ...this.map.values() ];
    }

    public has(key: string) {
        return this.map.has(key);
    }

    public set(key: string, value: any): void {
        // Check if immutable
        if (this.immutable)
            throw new Error(Error.Code.ForbiddenOperation, 'Cannot set a value for an immutable KeyMap');

        // Set the key value
        this.map.set(key, value);
    }

    public get(key: string): any {
        // Return the value
        return this.map.get(key);
    }

    public remove(key: string): void {
        // Check if immutable
        if (this.immutable)
            throw new Error(Error.Code.ForbiddenOperation, 'Cannot remove from an immutable KeyMap');

        // Remove the key from the map
        this.map.delete(key);
    }

    public toArray() {
        return [ ...this.map.entries() ];
    }

    public freeze() {
        this.immutable = true;
    }

    public toJSON(): object {
        // Get json
        const json = this.toArray().reduce((map, [key, value]) => ({ ...map, [key]: value }), {});

        // Set immutability
        if (this.immutable) return Object.freeze(json);

        // Return json
        return json;
    }
}