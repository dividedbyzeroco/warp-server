var _ = require('underscore');
var middleware = require('./middleware');

module.exports = {
    status: function(req, res, next) {    
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
    },
    start: function(req, res, next) {    
        var name = req.params.name;
        res.json({ status: 200, message: 'Success', result: { name: name } });
        
        // Run action
        this._getQueue(name).start();
    },
    stop: function(req, res, next) {
        var name = req.params.name;
        res.json({ status: 200, message: 'Success', result: { name: name } });
        
        // Run action
        this._getQueue(name).stop();
    },
    apply: function(context, router) {
        var masterKeyRequired = middleware.requireMasterKey(this._config.security.masterKey);
        router.get('/queues/:name', masterKeyRequired, this.status.bind(context));
        router.post('/queues/:name/start', masterKeyRequired, this.start.bind(context));
        router.post('/queues/:name/stop', masterKeyRequired, this.stop.bind(context));
        return router;
    }
};