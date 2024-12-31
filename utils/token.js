const jwt = require("jsonwebtoken");
const secret = "khdbfbslfkjblf";

class Token {
    static createToken(userId) {
        return new Promise((resolve, reject) => {
            jwt.sign({ userId }, secret, (err, token) => {
                if (err) {
                    return reject(err);
                }
                resolve(token);
            });
        })
    }

    static verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secret, (err, decoded) => {
                if (err) {
                    return reject(err);
                }
                resolve(decoded);
            });
        })
    }
}

module.exports = Token;