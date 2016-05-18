// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');

/******************************************************/

// Class constructor
var Migration = function(def) {
    // Check if migrations are activated
    if(!Migration.activated) throw Migration._deactivatedError;
      
    // Initialize keys    
    this.id = def.id;
    this.up = def.up;
    this.down = def.down;
};

// Instance methods
_.extend(Migration.prototype, {
    create: function() {
        // Insert a migration
        var now = moment().tz('UTC');
        var action = new Migration._actionQuery(Migration.className);  
        return action.fields({
            'id': this.id,
            'up': JSON.stringify(this.up),
            'down': JSON.stringify(this.down),
            'created_at': now.format('YYYY-MM-DD HH:mm:ss'),
            'updated_at': now.format('YYYY-MM-DD HH:mm:ss')
        })
        .create();
    },
    update: function() {
        // Update a migration
        var now = moment().tz('UTC');
        var action = new Migration._actionQuery(Migration.className, this.id);        
        return action.fields({
            'up': JSON.stringify(this.up),
            'down': JSON.stringify(this.down),
            'updated_at': now.format('YYYY-MM-DD HH:mm:ss')
        })
        .update();
    },
    commit: function() {
        // Execute Up
    },
    revert: function() {
        // Execute Down
    }
});

// Static methods
_.extend(Migration, {
    _masterKey: null,
    _viewQuery: null,
    _actionQuery: null,
    _schemaQuery: null,
    _deactivatedError: new WarpError(WarpError.Code.ForbiddenOperation, 'The migrations feature is not activated for this application'),
    _activate: function() {       
        // Set activated value
        this.activated = true;
                 
        // Create migration table, if it does not exist
        var schema = new this._schemaQuery(this.className);
        schema.fields({
            'id': {
                type: 'string',
                details: ['primary']
            },
            'up': 'text',
            'down': 'text',
            'committed_at': 'datetime',
            'created_at': 'datetime',
            'updated_at': 'datetime',
            'deleted_at': 'datetime'
        })
        .createOnce(function() {
            console.log('[Warp Migration] `migration` table has been initialized');
        })
        .catch(function(error) {
            console.error('[Warp Migration] Could not create `migration` table', error.message, error.stack);
        });
    },
    className: 'migration',
    activated: false,
    initialize: function(config, query) {
        this._masterKey = config.security.masterKey;
        this._viewQuery = query.View;
        this._actionQuery = query.Action;
        this._schemaQuery = query.Schema;
        
        // Check if the migrations feature is activated
        if(!config.migrations || typeof config.migrations.activated === 'undefined' ||  config.migrations.activated)
        {
            this.className = config.className || this.className;
            this._activate();
        }
    },
    create: function(id, up, down) {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        return new this({ id: id, up: up, down: down });
    },
    commit: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        // Query all pending migrations
        // Commit each
    },
    revert: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        // Query latest committed migrations
        // Revert       
    },
    reset: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        // Query all committed migrations
        // Revert each
    }
});

module.exports = Migration;