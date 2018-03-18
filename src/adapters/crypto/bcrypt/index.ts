import * as bcrypt from 'bcryptjs';
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
    constructor(salt: string | number) {
        this._salt = salt;
    }

    /**
     * 
     * @param {String} password 
     */
    hash(password: string) {
        return bcrypt.hashSync(password, this._salt);
    }

    /**
     * @param {String} password
     * @param {String} hashed
     */
    validate(password: string, hashed: string) {
        return bcrypt.compareSync(password, hashed);
    }
}