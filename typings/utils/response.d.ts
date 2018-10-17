import express from 'express';
import Error from './error';
export default class Response {
    private _customResponse;
    constructor(customize?: boolean);
    success(req: express.Request, res: express.Response, next: express.NextFunction): void;
    error(err: Error, req: express.Request, res: express.Response, next: express.NextFunction): void;
}
