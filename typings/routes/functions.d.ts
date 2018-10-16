import express from 'express';
import WarpServer from '../index';
/**
 * Define router
 */
declare const functions: (api: WarpServer) => express.Router;
export default functions;
