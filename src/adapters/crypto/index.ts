import { ICryptoAdapter } from '../../types/crypto';
import Error from '../../utils/error';
import BcryptCryptoAdapter from './bcrypt';

export default class Crypto {

    static Algorithms = Object.freeze({
        'bcrypt': BcryptCryptoAdapter
    });

    /**
     * Static use
     */
    static use(algorithm: string, passwordSalt: number): ICryptoAdapter {
        // Get algorithm
        const cryptoAlgo = this.Algorithms[algorithm];
        
        // Check if algo exists
        if(typeof cryptoAlgo === 'undefined')
            throw new Error(Error.Code.MissingConfiguration, `Crypto \`${algorithm}\` is not supported`);
        else
            return new cryptoAlgo(passwordSalt);
    }

}