import DataMapper from '../features/orm/data-mapper';
import User from '../features/auth/user';

/**
 * Middleware interface for additional Warp props
 */
export interface MiddlewareRequest<U extends User | undefined> {
    user: U,
    classes: DataMapper
}