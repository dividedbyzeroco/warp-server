import { JsonActionType } from '../../../types/json';
import { SetJsonTypeName, AppendJsonTypeName } from '../../../utils/constants';

export class JsonAction {

    type: JsonActionType;
    keyValue: [ string, any ];
    pathName: string;
    escapeKey: (value: any) => string = value => value;
    escape: (value: any) => string = value => value;

    constructor(type: JsonActionType, key: string, path: string, value: any) {
        this.type = type;
        this.keyValue = [ key, value ];
        this.pathName = path;
    }

    static isImplementedBy(value: any) {
        if(value === null) return false;
        if(![SetJsonTypeName, AppendJsonTypeName].includes(value.type)) return false;
        return true;
    }

    get key(): string {
        return this.keyValue[0];
    }

    get value(): string {
        return this.keyValue[1];
    }

    get path(): string {
        return this.pathName;
    }

    toSqlString() {
        if(this.type === SetJsonTypeName) {
            const key = `IFNULL(${this.escapeKey(this.key)}, JSON_OBJECT())`;
            const path = this.escape(this.path);
            const value = typeof this.value === 'object' ? `CAST(${this.escape(JSON.stringify(this.value))} AS JSON)` : this.escape(this.value);
            return `JSON_SET(${key}, ${path}, ${value})`;
        }
        else if(this.type === AppendJsonTypeName) {
            const key = `IFNULL(${this.escapeKey(this.key)}, JSON_ARRAY())`;
            const path = this.escape(this.path);
            const val = typeof this.value === 'object'? `CAST(${this.escape(JSON.stringify(this.value))} AS JSON)` : this.escape(this.value);
            return `JSON_ARRAY_APPEND(${key}, ${path}, ${val})`;
        }
    }
}