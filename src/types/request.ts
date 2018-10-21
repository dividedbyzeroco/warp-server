import DataMapper from '../classes/data-mapper';
import User from '../classes/auth/user';

/**
 * Middleware interface for additional Warp props
 */
export interface MiddlewareRequest<U extends User | undefined> {
    user: U,
    classes: DataMapper
}