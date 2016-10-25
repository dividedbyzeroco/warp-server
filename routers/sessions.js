var _ = require('underscore');
var middleware = require('./middleware');

module.exports = {
    find: function(req, res, next) {
        var options = {
            include: req.query.include? JSON.parse(req.query.include) : [],
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.sort? JSON.parse(req.query.sort) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0
        };
        
        var find = this._getSessionModel().find(options);
            
        // View objects
        find.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    first: function(req, res, next) {
        var include = req.query.include? JSON.parse(req.query.include) : [];
        var id = parseInt(req.params.id);
        var first = this._getSessionModel().first(id, include);
        
        // View object
        first.then(function(result) {        
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err) {
            next(err);
        });
    },
    create: function(req, res, next) {
        var fields = _.extend({}, req.body);
        var create = this._getSessionModel().create({ fields: fields }, { client: req.client, sdkVersion: req.sdkVersion, appVersion: req.appVersion });
        
        // Create object
        create.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    update: function(req, res, next) {
        var params = _.extend({}, req.body);
        var id = parseInt(req.params.id);
        var update = this._getSessionModel().update({ id: id, fields: params }, { client: req.client, sdkVersion: req.sdkVersion, appVersion: req.appVersion });
        
        // Update object
        update.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    destroy: function(req, res, next) {
        var id = parseInt(req.params.id);
        var destroy = this._getSessionModel().destroy({ id: id }, { client: req.client, sdkVersion: req.sdkVersion, appVersion: req.appVersion });
        
        // Delete object
        destroy.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    apply: function(context, router) {
        var masterKeyRequired = middleware.requireMasterKey(context._config.security.masterKey);
        router.get('/sessions', masterKeyRequired, this.find.bind(context));
        router.get('/sessions/:id', masterKeyRequired, this.first.bind(context));
        router.post('/sessions', masterKeyRequired, this.create.bind(context));
        router.put('/sessions/:id', masterKeyRequired, this.update.bind(context));
        router.delete('/sessions/:id', masterKeyRequired, this.destroy.bind(context));
        return router;
    }
};