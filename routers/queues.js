var _ = require('underscore');
var middleware = require('./middleware');

module.exports = {
    status: function(req, res, next) {    
        try
        {
            var name = req.params.name;
            var isActive = this._getQueue(name).isActive();
            var latestSuccess = this._getQueue(name).getLatestSuccess();
            var latestError = this._getQueue(name).getLatestError();
            var result = { 
                name: name, 
                is_active: isActive, 
                latest_success: latestSuccess, 
                latest_error: latestError 
            };
            res.json({ status: 200, message: 'Success', result: result });
        }
        catch(ex)
        {
            next(ex);
        }
    },
    start: function(req, res, next) {
        try
        {    
            var name = req.params.name;
                        
            // Run action
            this._getQueue(name).start();
            
            // Return response
            res.json({ status: 200, message: 'Success', result: { name: name } });
        }
        catch(ex)
        {
            next(ex);
        }
    },
    stop: function(req, res, next) {
        try
        {
            var name = req.params.name;
            
            // Run action
            this._getQueue(name).stop();
            
            // Return response
            res.json({ status: 200, message: 'Success', result: { name: name } });
        }
        catch(ex)
        {
            next(ex);
        }
    },
    apply: function(context, router) {
        var masterKeyRequired = middleware.requireMasterKey(context._config.security.masterKey);
        router.get('/queues/:name', masterKeyRequired, this.status.bind(context));
        router.post('/queues/:name/start', masterKeyRequired, this.start.bind(context));
        router.post('/queues/:name/stop', masterKeyRequired, this.stop.bind(context));
        return router;
    }
};