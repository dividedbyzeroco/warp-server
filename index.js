// References
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

// Define Warp Server
var WarpServer = {
    Query: {
        View: require('./query/view'),
        Action: require('./query/action'),
        Schema: require('./query/schema')
    },
    Model: require('./model'),
    Error: require('./error'),
    Migration: require('./migration')
};

// Static methods
_.extend(WarpServer, {
    initialize: function(config) {        
        if(!config.database) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB configuration must be set');
        if(!config.database.host) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB Host must be set');
        if(!config.database.user) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB User must be set');
        if(!config.database.password) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB Password must be set');
        if(!config.security) throw new this.Error(this.Error.Code.MissingConfiguration, 'Security keys must be set');
        if(!config.security.apiKey) throw new this.Error(this.Error.Code.MissingConfiguration, 'API Key must be set');
        if(!config.security.masterKey) throw new this.Error(this.Error.Code.MissingConfiguration, 'Master Key must be set')
                
        this._database = require('./services/database').initialize(config.database);
        this._security = require('./services/security');
        this.Query.View.initialize(this._database);
        this.Query.Action.initialize(this._database);
        this.Query.Schema.initialize(this._database);
        this.Model.initialize(this._security, this.Query);
        this.Migration.initialize(config, this.Query);
        
        // Prepare routers
        var router = express.Router();
        var middleware = require('./routers/middleware');
        var classRouter = require('./routers/classes');
        var userRouter = require('./routers/users');
        var sessionRouter = require('./routers/sessions');
        var migrationRouter = require('./routers/migrations');
        
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
        
        // Apply masterKey-required routers
        router.use(middleware.requireMasterKey(config.security.masterKey));
        migrationRouter.apply(this, router);
        
        return router;
    }
});

// Export modules
module.exports = WarpServer;