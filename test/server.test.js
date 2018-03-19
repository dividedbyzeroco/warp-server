/**
 * References
 */
import WarpServer from '../dist';
import express from 'express';
import { expect } from 'chai';

(() => {
    // Prepare api
    let api;

    describe('WarpServer', () => {
        before(done => {
            // Create api
            api = new WarpServer({
                security: {
                    apiKey: '331431',
                    masterKey: '34314134'
                }
            });

            // Initialize api
            api.initialize().then(done);
        });

        it('should be an express router', () => {
            expect(api.router).to.be.an.instanceof(express.Router);
            return;
        }); 
    });
})();