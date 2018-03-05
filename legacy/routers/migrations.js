var _ = require('underscore');
var middleware = require('./middleware');

module.exports = {
    find: function(req, res, next) {
        var className = req.params.className;
        var options = {
            select: req.query.select? JSON.parse(req.query.select) : {},
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.order? JSON.parse(req.query.order) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0
        };
        
        // Remove all deleted migrations
        options.where.deleted_at = {
            'ex': false
        };
        
        var query = new this.Query.View(this.Migration.className);
                
        // View objects
        query.select({
            'id': 'id',
            'up': 'up',
            'down': 'down',
            'committed_at': 'committed_at',
            'created_at': 'created_at',
            'updated_at': 'updated_at'
        })
        .where(options.where)
        .sort(options.sort)
        .limit(options.limit)
        .skip(options.skip)
        .find(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    current: function(req, res, next) {
        var className = req.params.className;
        var id = req.params.id;
                        
        // Get current migration
        this.Migration.current()
        .then(function(migration) 
        {
            res.json({ status: 200, message: 'Success', result: migration.id });
        }.bind(this))
        .catch(function(err) 
        {
            next(err);
        });
    },
    first: function(req, res, next) {
        var className = req.params.className;
        var id = req.params.id;
        
        // View object
        var query = new this.Query.View(this.Migration.className);
                
        // View object
        query.select({
            'id': 'id',
            'up': 'up',
            'down': 'down',
            'committed_at': 'committed_at',
            'created_at': 'created_at',
            'updated_at': 'updated_at'
        })
        .where({
            'id': {
                'eq': id
            },
            'deleted_at': {
                'ex': false
            }
        })
        .first(function(result) 
        {        
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err) 
        {
            next(err);
        });
    },
    create: function(req, res, next) {
        var options = _.extend({}, req.body);
        var migration = new this.Migration(options);
        
        // Create object
        migration.create().then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    update: function(req, res, next) {
        var options = _.extend({}, req.body);
        var id = req.params.id;
        
        options.id = id;
        var migration = new this.Migration(options);
        
        // Update object
        migration.update().then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    destroy: function(req, res, next) {
        var id = req.params.id;
        var migration = new this.Migration({ id: id });
        
        // Delete object
        migration.destroy().then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    commit: function(req, res, next) {
        // Commit pending migrations
        this.Migration.commit().then(function(result) 
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err) 
        {
            next(err);
        });
    },
    revert: function(req, res, next) {
        // Revert current migration
        this.Migration.revert().then(function(result) 
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err) 
        {
            next(err);
        });
    },
    reset: function(req, res, next) {
        // Reset all migrations
        this.Migration.reset().then(function(result) 
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
        router.get('/migrations', masterKeyRequired, this.find.bind(context));
        router.get('/migrations/current', masterKeyRequired, this.current.bind(context));
        router.get('/migrations/:id', masterKeyRequired, this.first.bind(context));
        router.post('/migrations', masterKeyRequired, this.create.bind(context));
        router.put('/migrations/:id', masterKeyRequired, this.update.bind(context));
        router.delete('/migrations/:id', masterKeyRequired, this.destroy.bind(context));
        router.post('/migrations/commit', masterKeyRequired, this.commit.bind(context));
        router.post('/migrations/revert', masterKeyRequired, this.revert.bind(context));
        router.post('/migrations/reset', masterKeyRequired, this.reset.bind(context));
        return router;
    }
};