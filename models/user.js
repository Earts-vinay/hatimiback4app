const mongoose = require("mongoose");
// const bcr = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    verify_otp: {
      type: Number
    },
    otp_expiry: {
      type: Date
    }
  },
  { timestamps: true, versionKey: false }
);


const customerSchema = new mongoose.Schema(
  {
    itsID: {
      type: String,
    },
    fullName: {
      type: String,
    },
    age: {
      type: String,
    },
    gender: {
      type: String
    },
    email: {
      type: String,
    },
    mobile_no: {
      type: String
    },
    whatsapp_No: {
      type: String
    },
    address: {
      type: String
    },
    nationality: {
      type: String
    },
    vatan: {
      type: String
    },
    maritialStatus: {
      type: String
    },
    misaq: {
      type: String
    },
    qualification: {
      type: String
    },
    occupation: {
      type: String
    },
    jamaat: {
      type: String
    },
    jamiaat: {
      type: String
    },
    city: {
      type: String
    },
    country: {
      type: String
    },
  },
  { timestamps: true, versionKey: false }
);
// userSchema.pre("save", async function (next) {
//   try {
//     const salt = await bcr.genSalt(10);
//     console.log(this.email, this.password);
//     const hashedpassword = await bcr.hash(this.password, salt);
//     this.password = hashedpassword;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// //decode the password
// userSchema.methods.validPassword = async function (password) {
//   try {
//     return await bcr.compare(password, this.password);
//   } catch (err) {
//     throw err;
//   }
// };

const User = mongoose.model("User", userSchema);
const Customer = mongoose.model("Customer", customerSchema);

module.exports = {User, Customer};
