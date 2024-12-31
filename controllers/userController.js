const {User, Customer} = require("../models/user");
const Hash = require("../utils/hash");
const Token = require("../utils/token");
const nodemailer = require("nodemailer");
require("dotenv").config();

const crypto = require('crypto');
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");



async function oneLoginDecryptData(cipherText) {
    const token = 'fpT8HuYiMWAoycFQ4DrVJxlvC1eSGt5hL0bO3qI7jXznRPgU9wkNB'; // Change to the token issued to your domain

    // Derive key using PBKDF2
    const salt = 'V*GH^|9^TO#cT';
    const key = crypto.pbkdf2Sync(token, salt, 1000, 32, 'sha1');
    const encryptionKey = key.slice(0, 16);
    const iv = key.slice(16, 32);

    // Decode the URL encoded and Base64 encoded cipher text
    const decodedCipherText = Buffer.from(decodeURIComponent(cipherText), 'base64');

    // Decrypt the data
    const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv);
    decipher.setAutoPadding(false);
    let decrypted = decipher.update(decodedCipherText, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}





class UserController {

static async register(req, res) {
    try {
      const emailExist = await User.findOne({ email: req.body.email });
      if (emailExist) {
        return res
          .status(200)
          .send({ status: false, error: "Email already exist." });
      }
      const usernameExist = await User.findOne({ username: req.body.username });
      if (usernameExist) {
        return res
          .status(200)
          .send({ status: false, error: "Username already exist." });
      }
      const password = await Hash.hashPassword(req.body.password);
      let user = new User({ ...req.body, password });
      await user.save();
      const token = await Token.createToken(user._id);
      user = JSON.parse(JSON.stringify(user));
      delete user.password;
      return res.send({ status: true, data: { ...user, token } });
    } catch (error) {
      console.error("UserController.register", error);
      return res
        .status(500)
        .send({ status: false, error: "Something went wrong" });
    }
  }

static async login(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email })
        .lean()
        .exec();
      if (!user) {
        return res
          .status(200)
          .send({ status: false, error: "Invalid Username or Password." });
      }
      const passwordValid = await Hash.verifyPassword(
        req.body.password,
        user.password
      );
      if (!passwordValid) {
        return res
          .status(200)
          .send({ status: false, error: "Invalid Username or Password." });
      }
      const token = await Token.createToken(user._id);
      delete user.password;
      return res.send({ status: true, data: { ...user, token } });
    } catch (error) {
      console.error("UserController.login", error);
      return res
        .status(500)
        .send({ status: false, error: "Something went wrong" });
    }
  }

static async changePassword(req, res) {
    try {
      const user = await User.findById(req.user);
      if (!user) {
        return res
          .status(200)
          .send({ status: false, error: "User not found." });
      }
      const passwordValid = await Hash.verifyPassword(
        req.body.password,
        user.password
      );
      if (!passwordValid) {
        return res
          .status(200)
          .send({ status: false, error: "Invalid old Password." });
      }
      const newPassword = await Hash.hashPassword(req.body.newPassword);
      user.password = newPassword;
      user.save();
      return res.send({ status: true, message: "Password updated successfully." });
    } catch (error) {
      console.error("UserController.changePassword", error);
      return res
        .status(500)
        .send({ status: false, error: "Something went wrong" });
    }
  }

static async resetPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
          return res.status(200).json({ status: false, message: "User not found" });
        }

        function generateNumericOTP(length) {
          const min = Math.pow(10, length - 1);
          const max = Math.pow(10, length) - 1;
          const OTP = Math.floor(Math.random() * (max - min + 1)) + min;

          // Set the OTP creation timestamp
          const otpCreationTime = new Date().getTime();

          // Set the expiry time to 15 minutes (in milliseconds)
          const otpExpiryTime = otpCreationTime + 15 * 60 * 1000;

          return {
            otp: OTP,
            expiryTime: otpExpiryTime,
          };
        }
        // Usage
        const generatedOTP = generateNumericOTP(6);

        // Access the OTP and its expiry time
        const OTP = generatedOTP.otp;
        const expiryTime = generatedOTP.expiryTime;


        console.log("Generated OTP:", OTP);
        console.log( "OTP Expiry Time:", new Date(expiryTime).toLocaleTimeString());

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset Password OTP",
        text: `Your OTP for Hatimi Reset password is ${OTP}. Do NOT share this OTP with anyone. This OTP is valid for the next 15 minutes.`,
      };

      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Failed to send reset password OTP email", error);
          res.status(500).json({status: false,message: "Failed to send reset password OTP email"});
        } else {
          await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { verify_otp: OTP, otp_expiry: new Date(expiryTime).toUTCString() } }
          );
          res.json({status:true, message: "Reset password OTP sent successfully", data:{OTP:OTP,expiryIn:new Date(expiryTime).toLocaleTimeString()}});
        }
      });
    } catch (error) {
      console.error("UserController.resetPassword", error);
      return res
        .status(500)
        .send({ status: false, error: "Something went wrong" });
    }
  }

static async verify(req, res) {

  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.verify_otp !== otp) {
      return res.status(200).json({ status: false, message: "Invalid OTP" });
    }

    const currentTimestamp = new Date().getTime();
    const otpExpiryTime = new Date(user.otp_expiry).getTime();

    if (currentTimestamp > otpExpiryTime) {
      return res.status(200).json({ status: false, message: "OTP has expired" });
    }
    // await User.findOneAndUpdate({ _id: user._id }, { $unset: { verify_otp: 1, otp_expiry: 1 } });

    return res.status(200).json({ status: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in OTP verification", error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
  }

static async updatePassword(req, res) {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Email, new password, and confirmation password are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({ status: false, message: "New password and confirmation password do not match" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found" });
    }

    // Hash the new password before updating
    const hashedPassword = await Hash.hashPassword(newPassword);

    // Update the user's password
    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
      $unset: { verify_otp: 1, otp_expiry: 1},
    });

    return res.status(200).json({ status: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in updating password", error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }

  }
static async logout(req, res) {
    try {
      const token = req.header("Authorization");
      const cookies = req.header("Cookies");

      if (!token) {
        return res.status(200).send({ status: false, error: "Unauthorized - Missing Token" });
      }
      const userId = await Token.verifyToken(token);
      // If userId is not present, the token is not valid
      if (!userId) {
        return res.status(200).send({ status: false, error: "Unauthorized" });
      }

      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res
              .status(500)
              .send({ status: false, error: "Something went wrong" });
          }
          return res.send({ status: true, message: "Logout session successful" });
        });
      }
      if (cookies) {
        res.clearCookie("accessToken");
        return res.send({ status: true, message: "Logout successful" });
      }
      return res.send({ status: true, message: "Logout successfully" });
    } catch (error) {
      console.error("UserController.logout", error);
      return res
        .status(500)
        .send({ status: false, error: "Something went wrong" });
    }
  }

static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user, { password: 0 });
      if (!user) {
        return res
          .status(200)
          .send({ status: false, error: "User not found." });
      }
      return res.send({ status: true, data: user });
    } catch (error) {
      console.error("UserController.getProfile", error);
      return res
        .status(500)
        .send({ status: false, error: "Something went wrong" });
    }
  }

// static async its_login(req, res) {
//     try {
//       var itsID = req.body.itsID
//       const soap = require('soap');
//       const url = 'https://ejas.its52.com/ejamaatservices.asmx?wsdl'; // Replace with your WSDL URL
//       // const args = { op: 'Estate_Dept_Hatemi', "ITS_ID": '60405343', 'strKey':"hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8" }; // mustafa ID
//       // const args = { op: 'Estate_Dept_Hatemi', "ITS_ID": '50442573', 'strKey':"hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8" }; //
//       // const args = { op: 'Estate_Dept_Hatemi', "ITS_ID": '30307008', 'strKey':"hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8" }; //
//       const args = { op: 'Estate_Dept_Hatemi', "ITS_ID": itsID, 'strKey':"hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8" }; //
//
//
//
//       // Options to pass to createClient
//       const options = {
//           wsdl_headers: {},
//           wsdl_options: {
//               headers: {
//                   Authorization: 'Bearer hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8'
//               }
//           }
//       };
//
//       soap.createClient(url, options, function(err, client) {
//           if (err) {
//               console.error('Error creating SOAP client:', err);
//               return;
//           }
//
//           // const token = 'hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8';
//           // client.addHttpHeader('Authorization', 'Bearer ' + token);
//
//            const methodName = 'Estate_Dept_Hatemi';
//
//           client[methodName](args, function(err, result) {
//           // client.get(args, function(err, result) {
//               if (err) {
//                   console.error('Error calling SOAP method:', err);
//                   return;
//               }
//
//               // console.log(result);
//               // console.log("attributes",result.Estate_Dept_HatemiResult.schema.attributes);
//               // console.log("element",result.Estate_Dept_HatemiResult.schema.element);
//               console.log("NewDataSet",result.Estate_Dept_HatemiResult.diffgram.NewDataSet);
//
//               var finalResult = result.Estate_Dept_HatemiResult.diffgram.NewDataSet
//               var dataObj = {
//                 itsID:finalResult.ITS_ID,
//                 fullName:finalResult.Fullname,
//                 age:finalResult.Age,
//                 gender:finalResult.Gender,
//                 email:finalResult.Email,
//                 mobile_no:finalResult.Mobile_no,
//                 whatsapp_No:finalResult.Whatsapp_No,
//                 address:finalResult.Address,
//                 nationality:finalResult.Nationality,
//                 vatan:finalResult.Vatan,
//                 maritialStatus:finalResult.Marital_Status,
//                 misaq:finalResult.Misaq,
//                 qualification:finalResult.Occupation,
//                 occupation:finalResult.Qualification,
//                 jamaat:finalResult.Jamaat,
//                 jamiaat:finalResult.Jamiaat,
//                 city:finalResult.City,
//                 country:finalResult.Country,
//               }
//
//
//               const customerExist = await Customer.findOne({ itsID: finalResult.ITS_ID });
//               if (customerExist) {
//
//                 await Customer.findOneAndUpdate(
//                   { _id: customerExist._id },
//                   { $set: dataObj }
//                 );
//
//               }else{
//                 await Customer.create(dataObj)
//               }
//
//               const customerFinal = await Customer.findOne({ itsID: finalResult.ITS_ID });
//
//               return res
//               .status(200)
//               .send({ status: true, data:customerFinal });
//           });
//       });
//
//
//     } catch (error) {
//       return res
//         .status(500)
//         .send({ status: false, message: "Something went wrong", error:error });
//     }
//   }

  static async its_login(req, res) {
      try {
        var decryptedString = req.body.decryptedString;
        var token = req.body.token;


        // Example usage
        // const cipherText = '0yFdJ%2fwBckRW%2fUMKKEvwMM5Q7yJadLLgrf%2bNPjffwFAejSnILJrZe%2bu4QrcFnBFuESxr2W%2f6Jl2SDb5RMjreq6qMKCv7gjTWnX%2bSJqlmqFiI9YVGUmjW1SzlqiIJnXkeXPUMKF4VzRq7lxRQVK02A9ercFlUMPrxBHBTfJThQzg94TJNVxHO6qwo0gHrI0fu' // Ensure the ciphertext is URL-encoded
        // // const cipherText = 'dddmJm8DT0VL5r36QIKwRE%2bbzXbqI3QeYWhiyeWe2I650Z%2fMKqHY4Ng4h5dNSsDZGNWoDQ34w%2bG5P4M%2fTGXQrXoSgpJwHCRKTIuMP5DNgHxYUbeE3xkMhbcdWZUUTGunRqgbJ0bHacm5I79DPMv6Ijg%2fILFVOsqB4ZkBgeDXsVMIXRvETYEVuoFj8JTsd6J%2bwnWXRT8LU%2b4kZUc5v2o%2bOnpAXxjj9Otv%2bToXm4lyVhY%3d' // Ensure the ciphertext is URL-encoded
        // const decryptedstr = oneLoginDecryptData(cipherText);
        // console.log(decryptedstr);




        if(decryptedString == undefined || decryptedString == "" || decryptedString == null){
          // decryptedString = cipherText1
          console.log("****decryptedString********",decryptedString);

          return res
              .status(500)
              .send({ status: false, message: "Something went wrong" });
        }else{

          var decryptedData = await oneLoginDecryptData(decryptedString)
          console.log("decryptedData",decryptedData);
          const splitData = decryptedData.split(',');
          // var itsID1 = (decryptedData.split(',')[0]).toString();
          // console.log("itsID1",typeof itsID1);

          console.log("dat$$$$$$",splitData[0].toString().trim());

          const itsID1 = splitData[0].toString().trim();
          // var itsID = (decryptedData.split(',')[0]).toString().trim();
          // var itsID = "50442573";
          var itsID = splitData[0].toString().trim();
          itsID = itsID.replace(/\x00/g, '');
          // var itsID = itsID1;
          console.log("itsID",itsID);
          console.log("itsID",itsID1);
          // console.log("itsID = ",typeof itsID);


          const util = require('util');
          const soap = require('soap');
          const url = 'https://ejas.its52.com/ejamaatservices.asmx?wsdl'; // Replace with your WSDL URL
          const args = { op: 'Estate_Dept_Hatemi', "ITS_ID": itsID, 'strKey': "hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8" };

          console.log("Args:", util.inspect(args, { depth: null }));
          // Options to pass to createClient
          const options = {
            wsdl_headers: {},
            wsdl_options: {
              headers: {
                Authorization: 'Bearer hrqsy4AJ0LwitKNsGO8yEynmi63IYmh8'
              }
            }
          };

          // Promisify createClient
          const createClient = (url, options) => {
            return new Promise((resolve, reject) => {
              soap.createClient(url, options, (err, client) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(client);
                }
              });
            });
          };

          // Promisify the SOAP method call
          const callSoapMethod = (client, methodName, args) => {
            return new Promise((resolve, reject) => {
              client[methodName](args, (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              });
            });
          };

          const client = await createClient(url, options);
          const methodName = 'Estate_Dept_Hatemi';
          const result = await callSoapMethod(client, methodName, args);

          console.log("result",result);
          console.log("Estate_Dept_HatemiResult",result.Estate_Dept_HatemiResult);
          console.log("diffgram",result.Estate_Dept_HatemiResult.diffgram);
          console.log("NewDataSet",result.Estate_Dept_HatemiResult.diffgram.NewDataSet);
          console.log("Table",result.Estate_Dept_HatemiResult.diffgram.NewDataSet.Table);

          const finalResult = result.Estate_Dept_HatemiResult.diffgram.NewDataSet.Table;
          const dataObj = {
            itsID: finalResult.ITS_ID,
            fullName: finalResult.Fullname,
            age: finalResult.Age,
            gender: finalResult.Gender,
            email: finalResult.Email,
            mobile_no: finalResult.Mobile_no,
            whatsapp_No: finalResult.Whatsapp_No,
            address: finalResult.Address,
            nationality: finalResult.Nationality,
            vatan: finalResult.Vatan,
            maritialStatus: finalResult.Marital_Status,
            misaq: finalResult.Misaq,
            qualification: finalResult.Occupation,
            occupation: finalResult.Qualification,
            jamaat: finalResult.Jamaat,
            jamiaat: finalResult.Jamiaat,
            city: finalResult.City,
            country: finalResult.Country,
          };

          console.log("dataObj",dataObj);
          const customerExist = await Customer.findOne({ itsID: finalResult.ITS_ID });
          if (customerExist) {
            await Customer.findOneAndUpdate(
              { _id: customerExist._id },
              { $set: dataObj }
            );
          } else {
            await Customer.create(dataObj);
          }

          const customerFinal = await Customer.findOne({ itsID: finalResult.ITS_ID });

          const accesstoken = await signAccessToken({
            userId: customerFinal._id
          });

          return res
          .status(200)
          .send({ status: true, message:"Login in successfully", data: customerFinal , accesstoken:accesstoken});
        }

      } catch (error) {

        console.log("************",error);
          return res
              .status(500)
              .send({ status: false, message: "Something went wrong", error: error });
      }
  }

  static async fetchCustomerDetails(req, res) {
      try {
        var customer_id = req.body.customer_id;

        const user = await Customer.findById(customer_id);
        if (!user) {
          return res
            .status(200)
            .send({ status: false, error: "Customer not found." });
        }else{
          return res
            .status(200)
            .send({ status: true, message: "Customer fetched successfully", data:user });
        }


      } catch (error) {
          return res
              .status(500)
              .send({ status: false, message: "Something went wrong", error: error });
      }
  }

}

module.exports = UserController;
