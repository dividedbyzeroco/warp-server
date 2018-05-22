import express from 'express';
export declare type ResponseFunctionsType = {
    success: express.RequestHandler;
    error: express.ErrorRequestHandler;
};
