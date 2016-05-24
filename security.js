// References
var bcrypt = require('bcryptjs');

module.exports = {
    hash: function(password, salt) {
        return bcrypt.hashSync(password, salt);
    },
    validate: function(password, hashed) {
        return bcrypt.compareSync(password, hashed);
    }
};