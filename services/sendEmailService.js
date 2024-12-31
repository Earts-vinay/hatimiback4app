const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
require("dotenv").config();


exports.sendMail = async (toEmail, subject, message) => {
  // console.log("Inside send email");

  // console.log("toEmail",toEmail);
  // console.log("subject",subject);
  // console.log("message",message);

  const transporter = nodemailer.createTransport({
    // host: process.env.SMTP_HOST,
    service: 'gmail',
    // port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: 'HatimiRetreats<backend@hatimiretreats.com>',
    // from: process.env.EMAIL_USER,
    to: toEmail,
    subject: subject,
    text: message,
    // attachments: [
    //   {
    //     filename: "invoice.pdf",
    //     contentType: "application/pdf",
    //     path: attachmentFilename,
    //   },
    // ],
  };


  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending email:', error);
    }
    console.log('Email sent successfully:', info.response);
  });

}
