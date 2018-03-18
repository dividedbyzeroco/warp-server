import express from 'express';

export type ResponseFunctionsType = {
    success: express.RequestHandler;
    error: express.ErrorRequestHandler;
};