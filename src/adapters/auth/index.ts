import { IAuthAdapter } from '../../types/auth';
import OauthAuthAdapter from './oauth';
import Error from '../../utils/error';

export default class Crypto {

    static Strategies = Object.freeze({
        'oauth': OauthAuthAdapter
    });

    /**
     * Static use
     */
    static use(strategy: string, passwordSalt: number): IAuthAdapter {
        // Get strategy
        const authStrategy = this.Strategies[strategy];
        
        // Check if algo exists
        if(typeof authStrategy === 'undefined')
            throw new Error(Error.Code.MissingConfiguration, `Auth strategy \`${strategy}\` is not supported`);
        else
            return new authStrategy(passwordSalt);
    }

}