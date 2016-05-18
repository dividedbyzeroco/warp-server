// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');

/******************************************************/

// Class constructor
var Migration = function(def) {
    this.id = def.id;
    this.up = def.up;
    this.down = def.down;
};

// Instance methods
_.extend(Migration.prototype, {
    save: function() {
        // Insert/Update a migration
        var action = new Migration._actionQuery(Migration.className, this.id);        
        return action.fields({
            'up': JSON.stringify(this.up),
            'down': JSON.stringify(this.down),
            'created_at': moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
            'updated_at': moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss')
        })
        .createOrUpdate({
            createOnly: ['created_at']
        });
    }
});

// Static methods
_.extend(Migration, {
    _masterKey: null,
    _viewQuery: null,
    _actionQuery: null,
    _schemaQuery: null,
    className: 'migration',
    initialize: function(config, query) {
        this._masterKey = config.masterKey;
        this._viewQuery = query.View;
        this._actionQuery = query.Action;
        this._schemaQuery = query.Schema;
        this.className = config.migrationClass || this.className;
        
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
    commit: function() {
        // Query all pending migrations
        // Commit each
    },
    revert: function() {
        // Query latest committed migrations
        // Revert       
    },
    reset: function() {
        // Query all committed migrations
        // Revert each
    }
});