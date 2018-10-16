import uniqid from 'uniqid';
import Class from './class';
import Key from './key';
import { InternalKeys } from '../utils/constants';

export default class Client extends Class {

    static get className(): string {
        return InternalKeys.Auth.Session;
    }

    static get identifierKey(): string {
        return InternalKeys.Auth.Identifier;
    }

    static get secretKey(): string {
        return InternalKeys.Auth.Secret;
    }

    static get nameKey(): string {
        return InternalKeys.Auth.Name;
    }

    static get descriptionKey(): string {
        return InternalKeys.Auth.Description;
    }

    static get typeKey(): string {
        return InternalKeys.Auth.Type;
    }

    static get scopeKey(): string {
        return InternalKeys.Auth.Scope;
    }

    static get statusKey(): string {
        return InternalKeys.Auth.Status;
    }

    static get keys(): Array<any> {
        return [
            this.identifierKey,
            this.secretKey,
            this.nameKey,
            this.descriptionKey,
            this.typeKey,
            Key(this.scopeKey).asJSON(),
            this.statusKey
        ];
    }

    set identifier(value: string) {
        this.set(this.statics<typeof Client>().identifierKey, value);
    }
    
    set secret(value: string) {
        this.set(this.statics<typeof Client>().secretKey, value);
    }

    set name(value: string) {
        this.set(this.statics<typeof Client>().nameKey, value);
    }

    set description(value: string) {
        this.set(this.statics<typeof Client>().descriptionKey, value);
    }

    set type(value: string) {
        this.set(this.statics<typeof Client>().typeKey, value);
    }

    set status(value: string) {
        this.set(this.statics<typeof Client>().statusKey, value);
    }

    get identifier(): string {
        return this.get(this.statics<typeof Client>().identifierKey);
    }
    
    get secret(): string {
        return this.get(this.statics<typeof Client>().secretKey);
    }

    get name(): string {
        return this.get(this.statics<typeof Client>().nameKey);
    }

    get description(): string {
        return this.get(this.statics<typeof Client>().descriptionKey);
    }

    get type(): string {
        return this.get(this.statics<typeof Client>().typeKey);
    }

    get status(): string {
        return this.get(this.statics<typeof Client>().statusKey);
    }

    async beforeSave() {
        if(this.isNew) {
            this.identifier = uniqid();
            this.status = InternalKeys.ClientStatus.Active;
        }
    }
}