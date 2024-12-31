const { sendMail } = require("../services/sendEmailService");

exports.createContactUs = async (req, res) => {
  try {
    const { about, name, email, phone, message } = req.body;
    // Create a new blog post
    var subject = "Customer Inquiry - Contact Us Page Details";
    var body = `Dear Hatimi Hotel Management Team,

I hope this email finds you well.

Please find below the details of a customer who has reached out to us via the "Contact Us" page on our website. Kindly review the information and follow up with the customer at your earliest convenience.

Customer Details:
About: ${about}
Name: ${name}
Email: ${email}
Phone Number: ${phone}
Message: ${message}

Please review these details at your earliest convenience. Should you have any questions or require additional information, please feel free to contact me directly at Phone Number ${phone} or Email ${email}.

Thank you for your attention to this matter. I look forward to your prompt response`;

    // const hatimiMail = "info@hatimiretreats.com"
    // const contactUsPage = await sendEmail(hatimiMail, subject, body);
    // const hatimiMail = "tejaswita@esenseit.in"
    const hatimiMail = "reservation@hatimiretreats.com,info@hatimiretreats.com"
    const contactUsPage = await sendMail(hatimiMail,subject,body)
    // const hatimiMail2 = "reservation@hatimiretreats.com,info@hatimiretreats.com"
    // const contactUsPage2 = await sendMail(hatimiMail2,subject,body)


    res.status(201).json({ message: "Mail Sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
