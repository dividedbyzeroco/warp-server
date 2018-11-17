import { IncrementTypeName } from '../../../utils/constants';

export default class Increment {

    private minimum: number;
    private maximum?: number;
    private keyValue: [ string, any ];
    public escapeKey: (value: any) => string = value => value;
    public escape: (value: any) => string = value => value;

    constructor(key: string, value: number, min: number = 0, max?: number) {
        this.keyValue = [ key, value ];
        this.minimum = min;
        this.maximum = max;
    }

    public static isImplementedBy(value) {
        if (value === null) return false;
        if (typeof value !== 'object') return false;
        if (value.type !== IncrementTypeName) return false;
        if (isNaN(value.value)) return false;
        return true;
    }

    public static by(value: number) {
        return { type: IncrementTypeName, value };
    }

    get key() {
        return this.keyValue[0];
    }

    get value() {
        return Number(this.keyValue[1]);
    }

    get min() {
        return this.minimum;
    }

    get max() {
        return this.maximum;
    }

    public toSqlString() {
        let escaped = `GREATEST(IFNULL(${this.escapeKey(this.key)}, 0) + (${this.escape(this.value)}), ${this.min})`;
        if (typeof this.max !== 'undefined') escaped = `LEAST(${escaped}, ${this.max})`;
        return escaped;
    }
}