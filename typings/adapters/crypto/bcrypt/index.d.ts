import { ICryptoAdapter } from '../../../types/crypto';
export default class BcryptCryptoAdapter implements ICryptoAdapter {
    /**
     * Private properties
     */
    _salt: string | number;
    /**
     * Constructor
     * @param {String} salt
     */
    constructor(salt: string | number);
    /**
     *
     * @param {String} password
     */
    hash(password: string): string;
    /**
     * @param {String} password
     * @param {String} hashed
     */
    validate(password: string, hashed: string): boolean;
}
