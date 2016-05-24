// References
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var WarpError = require('./error');

// Define Warp Server
var WarpServer = function(config) {
    // Check required configurations     
    this._requiredConfig(config.database, 'DB configuration');
    this._requiredConfig(config.database.host, 'DB Host');
    this._requiredConfig(config.database.user, 'DB User');
    this._requiredConfig(config.database.password, 'DB Password');
    this._requiredConfig(config.security, 'Security keys');
    this._requiredConfig(config.security.apiKey, 'API Key');
    this._requiredConfig(config.security.masterKey, 'Master Key');
            
    // Prepare database service based on config
    this._database = new require('./services/database')(config.database);
    
    // Extend query classes based on database service
    this.Query = {
        View: WarpServer.Query.View.extend(database),
        Action: WarpServer.Query.Action.extend(database),
        Schema: WarpServer.Query.Schema.extend(database)
    };
    
    // Extend storage class based on config
    this.Storage = WarpServer.Storage.extend(config.storage);
    
    // Register model classes
    if(config.models && config.models.source)
    {
        var source = config.models.path;
        var appendQueries = function(model) {
            model._viewQuery = this.Query.View;
            model._actionQuery = this.Query.Action;
            model._storage = this.Storage;
            return model;    
        }.bind(this);
        
        if(typeof source === 'string')
        {
            fs.readdirSync(modelPath)
            .filter(function(file) {
                return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
            })
            .forEach(function(file) {
                var model = require(path.join(modelPath, file));
                model = appendQueries(model);
                
                if(file === config.models.user)
                    this._user = model;
                else if(file === config.models.session)
                    this._session = model;
                else
                    this._models[model.className] = model;
            }.bind(this));
        }
        else if(typeof source === 'object' && source.forEach)
        {
            source.forEach(function(model) {
                model = appendQueries(model);
                this._models[model.className] = model;
            }.bind(this));
            
            if(typeof config.models.user === 'object')
            {
                var model = config.models.user;
                model = appendQueries(model);
                this._user = model;
            }
            
            if(typeof config.models.session === 'object')
            {
                var model = config.models.session;
                model = appendQueries(model);
                this._session = model;
            }
        }
    }
    
    // Extend migrations based on config and query classes
    this.Migration = WarpServer.Migration.extend(config.migrations, this.Query);
    
    // Prepare routers
    var router = express.Router();
    var middleware = require('./routers/middleware');
    var classRouter = require('./routers/classes');
    var userRouter = require('./routers/users');
    var sessionRouter = require('./routers/sessions');
    var migrationRouter = require('./routers/migrations');
    var fileRouter = require('./routers/files');
    
    // Apply middleware
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: false }));
    router.use(middleware.enableCors);
    router.use(middleware.sessionToken);
    
    // Apply apiKey-only routers
    router.use(middleware.requireAPIKey(config.security.apiKey));
    classRouter.apply(this, router);
    userRouter.apply(this, router);
    sessionRouter.apply(this, router);
    fileRouter.apply(this, router);
    
    // Apply masterKey-required routers
    router.use(middleware.requireMasterKey(config.security.masterKey));
    migrationRouter.apply(this, router);
    
    return router;
};

// Instance methods
_.extend(WarpServer.prototype, {
    _models: {},
    _user: null,
    _session: null,
    _requiredConfig: function(config, name) {
        if(!config) throw new WarpError(WarpError.Code.MissingConfiguration, name + ' must be set');
    },
    getModel: function(className) {
        if(className == this._user.className) throw new WarpError(WarpError.Code.ForbiddenOperation, 'User operations must use appropriate route');
        if(className == this._session.className) throw new WarpError(WarpError.Code.ForbiddenOperation, 'Session operations must use appropriate route');
        var model = this._models[className];
        if(!model) throw new WarpError(WarpError.Code.ModelNotFound, 'Model not found');
        return model;
    },
    getUserModel: function() {
        return this._user;
    },
    getSessionModel: function() {
        return this._session;
    }    
});

// Static properties and methods
_.extend(WarpServer, {
    Query: {
        View: require('./query/view'),
        Action: require('./query/action'),
        Schema: require('./query/schema')
    },
    Model: require('./model'),
    Migration: require('./migration'),
    Storage: require('./storage')
});

// Export modules
module.exports = WarpServer;