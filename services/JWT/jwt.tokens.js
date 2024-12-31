const jwt = require("jsonwebtoken");
const createError = require("http-errors");
// const client = require("../Redis/init_redis");
module.exports = {
  signAccessToken: async (user) => {
    return new Promise((resolve, reject) => {
      const payload = user;
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "10h",
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err);
          reject(createError.InternalServerError());
        } else {
          resolve(token);
        }
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    try {

      // console.log("******************req.headers*************",req.headers);
      if (!req.headers["authorization"]) {
        throw createError.Unauthorized("Unauthorized");
      }
      const authHeader = req.headers["authorization"];
      const bearerToken = authHeader.split(" ");
      const token = bearerToken[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
          const message =
            err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
          throw createError.Unauthorized(message);
        }
        req.payload = payload;
        next();
      });
    } catch (error) {
      res
        .status(error.status)
        .json({ status: error.status, error: error.message });
    }
  },
  // signRefreshToken: (user) => {
  //   return new Promise((resolve, reject) => {
  //     const payload = user;
  //     const secret = process.env.REFRESH_TOKEN_SECRET;
  //     const options = {
  //       expiresIn: "1y",
  //     };
  //     jwt.sign(payload, secret, options, (err, token) => {
  //       if (err) {
  //         console.log(err);
  //         reject(createError.InternalServerError());
  //       } else {
  //         client.set(
  //           payload.email,
  //           token,
  //           "EX",
  //           365 * 24 * 60 * 60,
  //           (err, reply) => {
  //             if (err) {
  //               console.log(err.message);
  //               reject(createError.InternalServerError());
  //               return;
  //             }
  //             resolve(token);
  //           }
  //         );
  //       }
  //     });
  //   });
  // },
  // verifyRefreshToken: (refreshtoken) => {
  //   return new Promise((reslove, reject) => {
  //     jwt.verify(
  //       refreshtoken,
  //       process.env.REFRESH_TOKEN_SECRET,
  //       (err, payload) => {
  //         if (err) return reject(createError.Unauthorized());
  //         const Cus_payload = payload;
  //         client.get(Cus_payload.email, (err, result) => {
  //           if (err) {
  //             console.log(err.message);
  //             reject(createError.InternalServerError());
  //             return;
  //           }
  //           if (refreshtoken === result) return reslove(payload);
  //           reject(createError.Unauthorized());
  //         });
  //       }
  //     );
  //   });
  // },
};
