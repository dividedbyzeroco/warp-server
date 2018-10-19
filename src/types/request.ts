import { Request as ExpressRequest } from 'express';
import DataMapper from '../classes/data-mapper';
import User from '../classes/auth/user';

/**
 * Middleware interface for additional Warp props
 */
interface MiddlewareRequest<U extends User | undefined> {
    user: U,
    classes: DataMapper
}

export type Request<U extends User | undefined> = ExpressRequest & MiddlewareRequest<U>;