// References
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');
var Warp = require('warp-sdk-js');

// Prepare log header
function logHeader() {
    return '[Warp Server ' + moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss') + ']';
}

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
    var database = require('./services/database');
    this._database = new database(config.database);
    
    // Extend query classes based on database service
    this.Query = {
        View: WarpServer.Query.View.extend(this._database),
        Action: WarpServer.Query.Action.extend(this._database),
        Schema: WarpServer.Query.Schema.extend(this._database)
    };
    
    // Extend storage class based on config
    this.Storage = WarpServer.Storage.extend(config.storage);    
    
    // Extend migrations based on config and query classes
    this.Migration = WarpServer.Migration.extend(config.migrations || {}, this.Query);
    
    // Store config
    this._config = config;
};

// Instance methods
_.extend(WarpServer.prototype, {
    _config: null,
    _models: {},
    _user: null,
    _session: null,
    _router: null,
    _functions: {},
    _queues: {},
    _requiredConfig: function(config, name) {
        if(!config) throw new WarpError(WarpError.Code.MissingConfiguration, name + ' must be set');
    },
    _getModel: function(className) {
        if(this._user && className == this._user.className) throw new WarpError(WarpError.Code.ForbiddenOperation, 'User operations must use the appropriate API');
        if(this._session && className == this._session.className) throw new WarpError(WarpError.Code.ForbiddenOperation, 'Session operations must use the appropriate API');
        var model = this._models[className];
        if(!model) throw new WarpError(WarpError.Code.ModelNotFound, 'Model not found');
        return model;
    },
    _getUserModel: function() {
        return this._user;
    },
    _getSessionModel: function() {
        return this._session;
    },
    _getFunction: function(name) {
        var func = this._functions[name];
        if(!func) throw new WarpError(WarpError.Code.FunctionNotFound, 'Function not found');
        return func;
    },
    _getQueue: function(name) {
        var queue = this._queues[name];
        if(!queue) throw new WarpError(WarpError.Code.QueueNotFound, 'Queue not found');
        return queue;
    },
    _isAScriptFile(file) {
        return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
    },
    _prepareRouter: function() {
        // Get warp
        this.Warp = Warp.bind(this);
        
        // Set config
        var config = this._config;
        
        // Register model classes
        if(config.models && config.models.source && (Object.keys(this._models).length == 0 || this._user && this._session))
        {
            // Get model source
            var source = config.models.source;
            
            // Define default auth models
            var user = null;
            var session = null;
            
            // Iterate through each model file
            fs.readdirSync(source)
            .filter(this._isAScriptFile)
            .forEach(function(file) {
                var model = require(path.join(source, file));                
                
                if(file.replace('.js', '') === config.models.user)
                    user = model;
                else if(file.replace('.js', '') === config.models.session)
                    session = model;
                else
                    this.registerModel(model);
            }.bind(this));
            
            // Register auth models
            this.registerAuthModels(user, session);
        }
        
        // Show warnings, if need be
        if(Object.keys(this._models).length == 0)
            console.log(logHeader(), 'WARNING: Models have not yet been defined');
        if(!this._user || !this._session)
            console.log(logHeader(), 'WARNING: User and/or session models have not been defined');
                    
        // Register function classes
        if(config.functions && config.functions.source && Object.keys(this._functions).length == 0)
        {
            // Get function source
            var source = config.functions.source;
            
            // Iterate through each function file
            fs.readdirSync(source)
            .filter(this._isAScriptFile)
            .forEach(function(file) {
                var func = require(path.join(source, file));
                this.registerFunction(func);
            }.bind(this));
        }
        
        // Register queue classes
        if(config.queues && config.queues.source && Object.keys(this._queues).length == 0)
        {
            // Get queue source
            var source = config.queues.source;
            
            fs.readdirSync(source)
            .filter(this._isAScriptFile)
            .forEach(function(file) {
                var queue = require(path.join(source, file));
                this.registerQueue(queue);
            }.bind(this));
        }
        
        // Prepare routers
        var router = express.Router();
        var middleware = require('./routers/middleware');
        var classRouter = require('./routers/classes');
        var userRouter = require('./routers/users');
        var sessionRouter = require('./routers/sessions');
        var migrationRouter = require('./routers/migrations');
        var fileRouter = require('./routers/files');
        var functionRouter = require('./routers/functions');
        var queueRouter = require('./routers/queues');
        
        // Apply middleware
        router.use(bodyParser.json());
        router.use(bodyParser.urlencoded({ extended: false }));
        router.use(middleware.enableCors);
        router.use(middleware.sessionToken);
        router.use(middleware.requireAPIKey(config.security.apiKey));
        
        // Apply API routes
        classRouter.apply(this, router);
        userRouter.apply(this, router);
        sessionRouter.apply(this, router);
        fileRouter.apply(this, router);
        functionRouter.apply(this, router);
        migrationRouter.apply(this, router);
        queueRouter.apply(this, router);
        
        // Set the router
        this._router = router;
        
        // Return router
        return this._router;
    },
    registerModel: function(model) {
        // Prepare model
        model._viewQuery = this.Query.View;
        model._actionQuery = this.Query.Action;
        model._storage = this.Storage;
        this._models[model.className] = model;
        return this;
    },
    registerModels: function(models) {
        models.forEach(function(model) {
            this.registerModel(model);
        }.bind(this));
    },
    registerAuthModels: function(user, session) {
        // Prepare user model
        user._viewQuery = this.Query.View;
        user._actionQuery = this.Query.Action;
        user._storage = this.Storage;
        this._user = user;  
        
        // Prepare session model      
        session._viewQuery = this.Query.View;
        session._actionQuery = this.Query.Action;
        session._storage = this.Storage;
        this._session = session;        
    },
    registerFunction: function(func) {
        this._functions[func.name] = func;    
    },
    registerFunctions: function(funcs) {
        funcs.forEach(function(func) {
            this.registerFunction(func);
        }.bind(this));    
    },
    registerQueue: function(queue) {
        this._queues[queue.name] = queue;
    },
    registerQueues: function(queues) {
        queues.forEach(function(queue) {
            this.registerQueue(queue);
        }.bind(this));  
    },
    // Return express router
    router: function() {
        if(this._router)
            return this._router;
        else
            return this._prepareRouter();
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
    Storage: require('./storage'),
    Function: require('./function'),
    Queue: require('./queue')
});

// Export modules
module.exports = WarpServer;