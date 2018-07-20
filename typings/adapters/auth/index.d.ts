import { IAuthAdapter } from '../../types/auth';
import OauthAuthAdapter from './oauth';
export default class Crypto {
    static Strategies: Readonly<{
        'oauth': typeof OauthAuthAdapter;
    }>;
    /**
     * Static use
     */
    static use(strategy: string, passwordSalt: number): IAuthAdapter;
}
