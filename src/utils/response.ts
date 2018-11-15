import express from 'express';
import Error from './error';
import { InternalKeys } from './constants';

export default class Response {

    private _customResponse = false;

    constructor(customize: boolean = false) {
        this._customResponse = customize;
    }

    success(req: express.Request, res: express.Response, next: express.NextFunction) {
        // Check if response success exists
        if(this._customResponse)
            next();
        else {
            // Set result
            const result = req[InternalKeys.Middleware.Result];

            // Set status and response
            res.status(200);
            res.json({ result });
        }
    }

    error(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
        // Check if response error exists
        if(this._customResponse)
            next(err);
        else {
            // Set code and message
            let status = err.status;
            let code = err.code;
            let message = err.message;

            // Check error code
            if(typeof err.code === 'undefined') {
                code = 400;
            }
            else if(err.code === Error.Code.DatabaseError) {
                message = 'Invalid query request';
            }

            // Set status
            res.status(status || 400);
            res.json({ code, message });
        }
    }
}