import { Request as ExpressRequest } from 'express';
import DataMapper from '../classes/data-mapper';
import User from '../classes/auth/user';

/**
 * Middleware interface for additional Warp props
 */
interface MiddlewareRequest<U extends void | User> {
    user: U,
    classes: DataMapper
}

export type Request<U extends void | User> = ExpressRequest & MiddlewareRequest<U>;