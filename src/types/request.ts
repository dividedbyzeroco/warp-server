import { Request as ExpressRequest } from 'express';
import ClassManager from '../features/orm/class-manager';
import User from '../features/auth/user';

/**
 * Middleware interface for additional Warp props
 */
export interface MiddlewareRequest<U extends User | undefined> {
    user: U;
    classes: ClassManager;
}

/**
 * Export new request type
 */
export type Request<U extends User | undefined> = ExpressRequest & MiddlewareRequest<U>;