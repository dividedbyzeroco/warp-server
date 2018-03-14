// @flow
export interface ICryptoAdapter {
    constructor(salt: string | number): void;
    hash(password: string): string;
    validate(password: string, hashed: string): string;
}