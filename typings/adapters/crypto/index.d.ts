import { ICryptoAdapter } from '../../types/crypto';
import BcryptCryptoAdapter from './bcrypt';
export default class Crypto {
    static Algorithms: Readonly<{
        'bcrypt': typeof BcryptCryptoAdapter;
    }>;
    /**
     * Static use
     */
    static use(algorithm: string, passwordSalt: number): ICryptoAdapter;
}
