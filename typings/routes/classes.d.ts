import express from 'express';
import WarpServer from '../index';
/**
 * Define router
 */
declare const classes: (api: WarpServer) => express.Router;
export default classes;
