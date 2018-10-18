import Class from '../class';
export default class Client extends Class {
    static readonly className: string;
    static readonly identifierKey: string;
    static readonly secretKey: string;
    static readonly nameKey: string;
    static readonly descriptionKey: string;
    static readonly typeKey: string;
    static readonly scopeKey: string;
    static readonly statusKey: string;
    static readonly keys: Array<any>;
    identifier: string;
    secret: string;
    name: string;
    description: string;
    type: string;
    status: string;
    beforeSave(): Promise<void>;
}
