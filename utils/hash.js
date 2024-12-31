const bcrypt = require('bcrypt');
const saltRounds = 10;

class Hash {
    static async hashPassword(password) {
        return await bcrypt.hash(password, saltRounds);
    }

    static async verifyPassword(password, passwordHash) {
        return await bcrypt.compare(password, passwordHash);
    }
}

module.exports = Hash;