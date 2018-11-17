import express from 'express';

export interface ResponseFunctionsType {
    success: express.RequestHandler;
    error: express.ErrorRequestHandler;
}