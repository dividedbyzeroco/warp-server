var moment = require('moment');
var _ = require('underscore');
var security = require('../services/security');

module.exports = {
    find: function(req, res, next) {
        var options = {
            select: req.query.select? JSON.parse(req.query.select) : {},
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.order? JSON.parse(req.query.order) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0
        };
        
        var find = this.Model.getUser().find(options);
            
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
        var id = req.params.id;
        var first = this.Model.getUser().first(id);
        
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
        
        if(!fields.username || !fields.password || !fields.email)
            throw new this.Error(this.Error.Code.InvalidCredentials, 'Missing credentials');
        
        var findUsername = this.Model.getUser().find({ where: {
            'username': { 'eq': fields.username }
        }});
        var findEmail = this.Model.getUser().find({ where: {
            'email': { 'eq' : fields.email }
        }})
                
        // Create object
        findUsername.then(function(result) {
            // Check if username is taken
            if(result.length > 0) throw new this.Error(this.Error.Code.UsernameTaken, 'Username already taken');
            return findEmail;
        }.bind(this))
        .then(function(result) {
            // Check if email is taken
            if(result.length > 0) throw new this.Error(this.Error.Code.EmailTaken, 'Email already taken');
            
            // Prepare user creation
            var create = this.Model.getUser().create({ fields: fields });
            return create;
        }.bind(this))
        .then(function(result)
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
        var id = req.params.id;
        var sessionToken = req.sessionToken;
        var query = new this.Query.View(this.Model.getSession().className);
        
        // Check session
        query.where({ 'session_token': { 'eq' : sessionToken }, 'deleted_at': { 'gt': moment().format('YYYY-MM-DD HH:mm:ss') } })
        .first(function(result) 
        {
            if(!result)
                throw new this.Error(this.Error.Code.InvalidSessionToken, 'Session does not exist');
            if(id != result.user_id)
                throw new this.Error(this.Error.Code.ForbiddenOperation, 'Users can only edit their own data');
            
            // Update object, if valid    
            return this.Model.getUser().update({ id: id, fields: params });
        }.bind(this))
        .then(function(result)
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
        var sessionToken = req.sessionToken;
        var query = new this.Query.View(this.Model.getSession().className);
        
        // Check session
        query.where({ 'session_token': { 'eq' : sessionToken }, 'deleted_at': { 'gt': moment().format('YYYY-MM-DD HH:mm:ss') } })
        .first(function(result) 
        {
            if(!result)
                throw new this.Error(this.Error.Code.InvalidSessionToken, 'Session does not exist');
            if(id != result.user_id)
                throw new this.Error(this.Error.Code.ForbiddenOperation, 'Users can only destroy their own data');
            
            // Destroy object, if valid    
            return this.Model.getUser().destroy({ id: id });
        }.bind(this))
        .then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    me: function(req, res, next) {
        var sessionToken = req.sessionToken;
        var query = new this.Query.View(this.Model.getSession().className);
        
        query.where({ 'session_token': { 'eq' : sessionToken }, 'deleted_at': { 'gt': moment().format('YYYY-MM-DD HH:mm:ss') } })
        .first(function(result) 
        {
            if(!result)
                throw new this.Error(this.Error.Code.InvalidSessionToken, 'Session does not exist');
            
            var first = this.Model.getUser().first(result.user_id);
            return first.then(function(user) {
                res.json({ status: 200, message: 'Success', result: user });
            });
        }.bind(this))
        .catch(function(err) 
        {
            next(err);
        });
    },
    login: function(req, res, next) {
        var username = req.body.username;
        var password = req.body.password;
        var origin = req.get('X-Warp-Origin');
        
        var query = new this.Query.View(this.Model.getUser().className);
        
        query.select({
            'id': 'id',
            'password': 'password'
        })
        .where({
            'username': { 'eq' : username }
        })
        .first(function(user) 
        {
            if(user && security.validate(password, user.password))
            {
                var fields = {
                    'user': {
                        type: 'Pointer',
                        id: user.id
                    },
                    'origin': origin
                };
                
                return this.Model.getSession().create({ fields: fields });
            }
            else
            {
                throw new this.Error(this.Error.Code.InvalidCredentials, 'Invalid username/password');
            }
        }.bind(this))
        .then(function(result) {
            return this.Model.getSession().first(result.id);
        }.bind(this))
        .then(function(session) {
            res.json({ status: 200, message: 'Success', result: session });
        })
        .catch(function(err) 
        {
            next(err);
        });
    },
    logout: function(req, res, next) {
        var sessionToken = req.sessionToken;
        var query = new this.Query.View(this.Model.getSession().className);
        
        query.where({ 'session_token': { 'eq' : sessionToken }, 'deleted_at': { 'gt': moment().format('YYYY-MM-DD HH:mm:ss') } })
        .first(function(session) 
        {
            if(!session)
            {
                throw new this.Error(this.Error.Code.InvalidSessionToken, 'Session does not exist');
            }
            
            var action = new this.Query.Action(this.Model.getSession().className, session.id);
            
            return action.fields({ deleted_at: moment().format('YYYY-MM-DD HH:mm:ss') })
            .update(function(result) {
                res.json({ status: 200, message: 'Success', result: result });
            });
        }.bind(this))
        .catch(function(err) {
            next(err);
        });
    },
    apply: function(context, router) {
        router.get('/users', this.find.bind(context));
        router.get('/users/me', this.me.bind(context));
        router.get('/users/:id', this.first.bind(context));
        router.post('/users', this.create.bind(context));
        router.put('/users/:id', this.update.bind(context));
        router.delete('/users/:id', this.destroy.bind(context));
        router.post('/login', this.login.bind(context));
        router.get('/logout', this.logout.bind(context));
        return router;
    }
};