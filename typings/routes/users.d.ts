import express from 'express';
import WarpServer from '../index';
/**
 * Define router
 */
declare const users: (api: WarpServer) => express.Router;
export default users;
