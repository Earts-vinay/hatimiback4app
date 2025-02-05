const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const { uploadImage } = require("../services/uploadService");
const moment = require("moment");
const { Company } = require("../models/masterCompanyDetailsModel");
const { Booking } = require("../models/bookingModel");
const { Property } = require("../models/propertyModel");


require("dotenv").config();

const pdf = require('dynamic-html-pdf');
var html4 = fs.readFileSync(require.resolve("../downloadpdf.html"), { encoding: "utf8" });


function formatDate(dateString) {
    // Parse the dateString to create a Date object
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Months are zero-based in JavaScript

    // Format the date as dd-mm-yyyy
    const dayFormatted = String(date.getDate()).padStart(2, '0');
    const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
    const yearFormatted = date.getFullYear();

    return `${dayFormatted}-${monthFormatted}-${yearFormatted}`;
}


function generate_payslip_pdf(booking, companyDetails){


  var newObj = {
    booking:booking,
    companyDetails:companyDetails,

  }
  var net_amount = booking.billing_info.total_Cost - booking.billing_info.discount
  // console.log("net_amount",net_amount);
  return new Promise(function(resolve, reject) {


    console.log("booking.room_info*************",booking.room_info);
    var options = {
      format: "A4",
      orientation: "portrait",
      printBackground: false,
      border: "",
      timeout:1000*60*5,
      // phantomPath: path.resolve(__dirname,'../phantomjs-prebuilt/bin/phantomjs')
    };

    // var random_no = randomNumber(4)
    // var stt = documents_path+emp_name+"_payslip_"+month+'-'+random_no+".pdf"
    // var stt1 = documents_url_path+emp_name+"_payslip_"+month+'-'+random_no+".pdf"

    const outputPath = path.join(__dirname, "../public/createinvoice/");
    const outputFile = Date.now() + "_" + "invoice.pdf";
    const outputFilePath = path.join(outputPath, outputFile);

    // console.log("booking",booking);
    var document = {
      type: 'file',
      template: html4,
      context: {
        // details: newObj,
        // booking:booking,
        // companyDetails:companyDetails,
        company_name:companyDetails.company_name,
        cin:companyDetails.cin,
        gstin:companyDetails.gstin,
        hsn:companyDetails.hsn,
        its:companyDetails.its,
        office_address:companyDetails.office_address,
        property_name:booking.property_name,
        phone_number:booking.phone_number,
        booking_id:booking.booking_id,
        invoice_id:booking.invoice_id,
        customer_info:booking.customer_info,
        formateddate:booking.formateddate,
        number_of_rooms:booking.number_of_rooms,
        check_in:booking.check_in,
        check_out:booking.check_out,
        daysDifference:booking.daysDifference,
        adults:booking.adults,
        children:booking.children,
        room_info:booking.room_info,
        property_name:booking.property_name,
        customer_info:booking.customer_info,
        gst_data:booking.gst_data,
        extra_services_info:booking.extra_services_info,
        mode_of_payment:booking.mode_of_payment,
        transaction_id:booking.transaction_id,
        billing_info:booking.billing_info,
        property_state:booking.property_state,
        property_city:booking.property_city,
        property_check_in_time:booking.property_check_in_time,
        property_check_out_time:booking.property_check_out_time,
        net_amount:net_amount.toFixed(2),
      },
      path:outputFilePath
      // path:stt
    };

    pdf.create(document, options)

    .then(res => {
      console.log("pdf generate successfully")
      resolve(outputFile)

    }).catch(error => {
      resolve("false")
      console.error("error",error)
    });
  });

}


exports.addInvoiceContentAndSendMail = async (booking, bookingID, bookingType) => {

  const companyDetails = await Company.findOne();
  const startDate = booking.check_in;
  const endDate = booking.check_out;
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  const daysDifference = endMoment.diff(startMoment, "days");

  var check_in = formatDate(booking.check_in)
  var check_out = formatDate(booking.check_out)

  var bookingdate = booking.createdAt
  var date = bookingdate.toISOString().split("T")[0]
  var formateddate = formatDate(date)


  booking.check_in = check_in
  booking.check_out = check_out
  booking.formateddate = formateddate
  booking.daysDifference = daysDifference

  // console.log("######################555555");


  const oldRoomInfo = await Property.findOne({property_uid: booking.property_uid});

  if(oldRoomInfo){
    booking.property_state = oldRoomInfo.property_state
    booking.property_city = oldRoomInfo.property_city
    booking.property_check_in_time = convertToAmPm(oldRoomInfo.check_in_time)
    booking.property_check_out_time = convertToAmPm(oldRoomInfo.check_out_time)
  }

  // console.log("property_state",booking.property_state);
  // console.log("property_city",booking.property_city);
  // console.log("property_check_in_time",booking.property_check_in_time);
  // console.log("property_check_out_time",booking.property_check_out_time);

  // generate_payslip_pdf(booking, companyDetails).then((res111) => {
  //   console.log("res111",res111);
  //   if (res111 !== "false") {
  //     // res.send({status:true,message:"pdf is generate successfully",path :res111})
  //
  //     console.log("bookingID",bookingID);
  //     var newBooking = await Booking.findOneAndUpdate({_id:bookingID},{
  //       pdf_file: res111
  //     },{new:true});
  //
  //     return res111;
  //
  //   } else{
  //     // res.send({status:false,message:"pdf not generate successfully",path:""})
  //     var nothing = ""
  //     return nothing;
  //   }
  // });

  const res111 = await generate_payslip_pdf(booking, companyDetails);
    // console.log("res111", res111);

    if (res111 !== "false") {
      // Assuming Booking.findOneAndUpdate returns a promise
      const newBooking = await Booking.findOneAndUpdate(
        { _id: bookingID },
        { pdf_file: res111 },
        { new: true }
      );

      // var pdfURL = "https://server.hatimiretreats.com/pms-backend/public/createinvoice/"+res111
      // var pdfURL = "http://10.213.229.131/pms-backend/public/createinvoice/"+res111

      const outputPath = path.join(__dirname, "../public/createinvoice/");
      const outputFile = res111;
      const outputFilePath = path.join(outputPath, outputFile);

      if(bookingType == 'createBooking'){

        if(booking.customer_info !== undefined && booking.customer_info !== null && booking.customer_info !== ""){
          if(booking.customer_info.email !== undefined && booking.customer_info.email !== null && booking.customer_info.email !== ""){


            await sendEmail(booking,outputFilePath)
          }
        }
        await sendManagerEmail("accounts@hatimiretreats.com",booking,outputFilePath)
        await sendManagerEmail("hsavai.estate@gmail.com",booking,outputFilePath)
        await sendManagerEmail("info@hatimiretreats.com",booking,outputFilePath)
        // await sendManagerEmail("tejaswitashrivastava18@gmail.com",booking,outputFilePath)
      }


      return res111;


      // Optionally send a response or handle newBooking
      // res.send({status: true, message: "PDF generated successfully", path: res111});
    } else {

      var nothing = ""
      return nothing;
      // Optionally send a response or handle error
      // res.send({status: false, message: "PDF not generated successfully", path: ""});
    }

}



function convertToAmPm(time) {
  // Split the time string into hours and minutes
  const [hourString, minuteString] = time.split(':');
  const hours = parseInt(hourString, 10);
  const minutes = parseInt(minuteString, 10);

  // Determine AM or PM suffix
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours from 24-hour to 12-hour format
  const hours12 = hours % 12 || 12; // Converts '0' to '12' for midnight

  // Format the time in 12-hour format with AM/PM
  const formattedTime = `${hours12}:${minuteString} ${ampm}`;

  return formattedTime;
}

// exports.addInvoiceContentAndSendMail = async (booking) => {
//   // console.log("booking",booking);
//   if (booking.payment_status === "success") {
//     // Assuming you have two dates in string format
//     const startDate = booking.check_in;
//     const endDate = booking.check_out;
//     const companyDetails = await Company.findOne();
//     // Calculate the difference in days
//     const startMoment = moment(startDate);
//     const endMoment = moment(endDate);
//     const daysDifference = endMoment.diff(startMoment, "days");
//     // Create an invoice using easyinvoice
//
//     // Launch a headless browser
//     const browser = await puppeteer.launch({
//       headless: "new",
//       ignoreDefaultArgs: ["--disable-extensions"],
//       args: ["--no-sandbox"],
//     });
//     const outputPath = path.join(__dirname, "../public/createinvoice/");
//     const outputFile = Date.now() + "_" + "invoice.pdf";
//     const outputFilePath = path.join(outputPath, outputFile);
//
//     var check_in = formatDate(booking.check_in)
//     var check_out = formatDate(booking.check_out)
//
//     var bookingdate = booking.createdAt
//     var date = bookingdate.toISOString().split("T")[0]
//     var formateddate = formatDate(date)
//
//     if(booking.mode_of_payment == undefined){
//       booking.mode_of_payment = ""
//     }
//
//     if(booking.transaction_id == undefined || booking.transaction_id == null){
//       booking.transaction_id = ""
//     }
//
//     if(booking.customer_info == undefined || booking.customer_info == null || booking.customer_info == ""){
//       var invoiceHTML = `<!DOCTYPE html>
//       <html lang="en">
//
//       <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
//           <link rel="stylesheet" type="text/css" href="style.css"> <!-- Replace "your_stylesheet.css" with your actual stylesheet path -->
//       </head>
//
//       <body>
//           <section class="container-fluid px-5 mt-5">
//               <div class="invoice mb-5">
//                   <h2>Tax Invoice</h2>
//               </div>
//               <div class="row">
//                   <div class="col-6 border-right">
//                       <img src="https://hatimi.s3.amazonaws.com/frontendpropertyImages/hatimi+logo.png" alt="" class="logo">
//                       <div class="address py-3 m-0">
//                           <p class="m-0">Fort Mumbai, 400001.</p>
//                           <p class="m-0">Contact - +91 9820834976</p>
//                           <p class="m-0">${booking.property_name} - ${
//         booking.phone_number
//       }</p>
//                       </div>
//                   </div>
//                   <div class="col-6 d-flex align-items-end">
//                       <div class="row  px-3">
//                           <div class="col-6">
//                               <h6>Invoice No</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${booking.booking_id}</p>
//                           </div>
//                           <div class="col-6">
//                               <h6>CIN.</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${companyDetails.cin}</p>
//                           </div>
//                           <div class="col-6">
//                               <h6>GST No.</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${companyDetails.gstin}</p>
//                           </div>
//                           <div class="col-6">
//                               <h6>HSN Code</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${companyDetails.hsn}</p>
//                           </div>
//                       </div>
//
//                   </div>
//               </div>
//               <div class="row my-5 border rounded">
//                   <div class="col-6 my-3">
//                       <h5>Guest Information</h5>
//                       <div class="my-3 d-flex align-items-end">
//                           <div class="row">
//                               <div class="col-6">
//                                   <h6>ITS</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${companyDetails.its}</p>
//                               </div>
//                               <div class="col-6">
//                                   <h6>Name</h6>
//                               </div>
//                               <div class="col-6">
//                               </div>
//                               <div class="col-6">
//                                   <h6>Address</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${companyDetails.office_address}</p>
//                               </div>
//                               <div class="col-6">
//                                   <h6>Email Id</h6>
//                               </div>
//                               <div class="col-6">
//                               </div>
//                               <div class="col-6">
//                                   <h6>Phone No.</h6>
//                               </div>
//                               <div class="col-6">
//
//                               </div>
//                           </div>
//
//                       </div>
//
//                   </div>
//                   <div class="col-6 my-3">
//                       <h5>Booking Information</h5>
//                       <div class=" my-3 d-flex align-items-end">
//                           <div class="row">
//                               <div class="col-6">
//                                   <h6>Property Name</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${booking.property_name}</p>
//                               </div>
//                               <div class="col-6">
//                                   <h6>Booking date</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${formateddate}</p>
//                               </div>
//                               <div class="col-6">
//                                   <h6>Booking ID</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${booking.booking_id}</p>
//                               </div>
//                               <div class="col-6">
//                                   <h6>No of Rooms</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${booking.number_of_rooms}</p>
//                               </div>
//                               <div class="col-6">
//                                   <h6>Check In Date</h6>
//                               </div>
//                               <div class="col-6">
//                                   <p>${check_in}</p>
//                               </div>
//                               <div class="col-6">
//                               <h6>Check out Date</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${check_out}</p>
//                           </div>
//                           <div class="col-6">
//                           <h6>Stay</h6>
//                       </div>
//                       <div class="col-6">
//                           <p>${daysDifference}</p>
//                       </div>
//                       <div class="col-6">
//                           <h6>No of Persons</h6>
//                       </div>
//                        && booking.customer_info.email<div class="col-6">
//                           <p>${booking.adults} Adults | ${
//         booking.children
//       } Childrens </p>
//                       </div>
//                           </div>
//                       </div>
//                   </div>
//               </div>
//               <div class="Accommodation">
//                   <h6>Accommodation details</h6>
//                   <table class="table">
//                       <thead class="bg-primary">
//                         <tr>
//                           <th scope="col">Sno</th>
//                           <th scope="col">Room Name</th>
//                           <th scope="col">Room Type</th>
//                           <th scope="col">Charges/Night</th>
//                           <th scope="col">Stay</th>
//                           <th scope="col">Total</th>
//                         </tr>
//                        && booking.customer_info.email</thead>
//                       <tbody>
//                       ${booking.room_info.map(
//                         (room, index) =>
//                           `<tr key="${index}">
//                           <td>${index + 1}</td>
//                           <td>${room.room_name}</td>
//                           <td>${room.room_type}</td>
//                           <td>${room.room_price}</td>
//                           <td>${daysDifference}</td>
//                           <td>${daysDifference * room.room_price}</td>
//                         </tr>`
//                       )}
//                       </tbody>
//                     </table>
//               </div>
//               <div class="Extra Services">
//                   <h6> Extra Service details </h6>
//                   <table class="table">
//                       <thead class="bg-primary">
//                         <tr>
//                           <th scope="col">Sno</th>
//                           <th scope="col">Service Name</th>
//                           <th scope="col">Service Quanity</th>
//                           <th scope="col">Charges/Night</th>
//                           <th scope="col">Stay</th>
//                           <th scope="col">Total</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                       ${booking.extra_services_info.map(
//                         (detail, index) =>
//                           `<tr key="${index}">
//                           <td>${index + 1}</td>
//                           <td>${detail.service_name}</td>
//                           <td>${detail.service_count}</td>
//                           <td>${detail.service_price}</td>
//                           <td>${daysDifference}</td>
//                           <td>${daysDifference * detail.service_price}</td>
//
//                         </tr>`
//                       )}
//                       </tbody>
//                     </table>
//               </div>
//               <div class="row my-5  d-flex justify-content-between">
//                   <div class="col-6">
//                       <h6> Payment Information </h6>
//                       <div class="row my-3">
//                           <div class="col-6">
//                               <h6>Name</h6>
//                           </div>
//                           <div class="col-6">
//                           </div>
//                           <div class="col-6">
//                               <h6>Mode of payment</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${booking.mode_of_payment}</p>
//                           </div>
//                           <div class="col-6">
//                               <h6>Transaction ID</h6>
//                           </div>
//                           <div class="col-6">
//                               <p>${booking.transaction_id}</p>
//                           </div>
//                       </div>
//                   </div>
//                   <div class="col-3 d-flex justy-content-end">
//                       <div class="row my-3">
//                           <div class="col-6 ">
//                               <p>Amount</p>
//                           </div>
//                           <div class="col-3 d-flex justify-content-end ">
//                               <p> ₹${booking.billing_info.total_Cost}.00</p>
//                           </div>
//                           <div class="col-6">
//                               <p>Discount</p>
//                           </div>
//                           <div class="col-3 d-flex justify-content-end">
//                               <p> ₹${booking.billing_info.discount}.00</p>
//                           </div>
//                           <div class="col-6">
//                               <p>CGST (%)</p>
//                           </div>
//                           <div class="col-3 d-flex justify-content-end">
//                               <p> ${booking.billing_info.cgst}</p>
//                           </div>
//                           <div class="col-6">
//                               <p>SGST (%)</p>
//                           </div>
//                           <div class="col-3 d-flex justify-content-end">
//                               <p> ${booking.billing_info.sgst}</p>
//                           </div>
//
//                           <div class="col-6">
//                              <p>IGST (%)</p>
//                          </div>
//                           <div class="col-3 d-flex justify-content-end">
//                              <p> ${booking.billing_info.igst}</p>
//                          </div>
//
//                           <div class="col-6">
//                               <h6>Amount</h6>
//                           </div>
//                           <div class="col-3 d-flex justify-content-end">
//                               <h6> ₹${
//                                 booking.billing_info?.amount_payable
//                               }.00</h6>
//                           </div>
//
//                       </div>
//                   </div>
//               </div>
//
//               <div class="thanks">
//                   <p class="text-center display-5">Thank you for Booking with us</p>
//               </div>
//
//           </section>
//
//           <!-- Bootstrap JS and Popper.js -->
//           <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
//           <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
//           <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
//       </body>
//
//       </html>`;
//     }else{
//       var invoiceHTML = `<!DOCTYPE html>
//     <html lang="en">
//
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
//         <link rel="stylesheet" type="text/css" href="style.css"> <!-- Replace "your_stylesheet.css" with your actual stylesheet path -->
//     </head>
//
//     <body>
//         <section class="container-fluid px-5 mt-5">
//             <div class="invoice mb-5">
//                 <h2>Tax Invoice</h2>
//             </div>
//             <div class="row">
//                 <div class="col-6 border-right">
//                     <img src="https://hatimi.s3.amazonaws.com/frontendpropertyImages/hatimi+logo.png" alt="" class="logo">
//                     <div class="address py-3 m-0">
//                         <p class="m-0">Fort Mumbai, 400001.</p>
//                         <p class="m-0">Contact - +91 9820834976</p>
//                         <p class="m-0">${booking.property_name} - ${
//       booking.phone_number
//     }</p>
//                     </div>
//                 </div>
//                 <div class="col-6 d-flex align-items-end">
//                     <div class="row  px-3">
//                         <div class="col-6">
//                             <h6>Invoice No</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${booking.booking_id}</p>
//                         </div>
//                         <div class="col-6">
//                             <h6>CIN.</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${companyDetails.cin}</p>
//                         </div>
//                         <div class="col-6">
//                             <h6>GST No.</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${companyDetails.gstin}</p>
//                         </div>
//                         <div class="col-6">
//                             <h6>HSN Code</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${companyDetails.hsn}</p>
//                         </div>
//                     </div>
//
//                 </div>
//             </div>
//             <div class="row my-5 border rounded">
//                 <div class="col-6 my-3">
//                     <h5>Guest Information</h5>
//                     <div class="my-3 d-flex align-items-end">
//                         <div class="row">
//                             <div class="col-6">
//                                 <h6>ITS</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${companyDetails.its}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Name</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${booking.customer_info.name}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Address</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${companyDetails.office_address}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Email Id</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${booking.customer_info.email}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Phone No.</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${booking.customer_info.mobile_number}</p>
//                             </div>
//                         </div>
//
//                     </div>
//
//                 </div>
//                 <div class="col-6 my-3">
//                     <h5>Booking Information</h5>
//                     <div class=" my-3 d-flex align-items-end">
//                         <div class="row">
//                             <div class="col-6">
//                                 <h6>Property Name</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${booking.property_name}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Booking date</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${formateddate}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Booking ID</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${booking.booking_id}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>No of Rooms</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${booking.number_of_rooms}</p>
//                             </div>
//                             <div class="col-6">
//                                 <h6>Check In Date</h6>
//                             </div>
//                             <div class="col-6">
//                                 <p>${check_in}</p>
//                             </div>
//                             <div class="col-6">
//                             <h6>Check out Date</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${check_out}</p>
//                         </div>
//                         <div class="col-6">
//                         <h6>Stay</h6>
//                     </div>
//                     <div class="col-6">
//                         <p>${daysDifference}</p>
//                     </div>
//                     <div class="col-6">
//                         <h6>No of Persons</h6>
//                     </div>
//                      && booking.customer_info.email<div class="col-6">
//                         <p>${booking.adults} Adults | ${
//       booking.children
//     } Childrens </p>
//                     </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <div class="Accommodation">
//                 <h6>Accommodation details</h6>
//                 <table class="table">
//                     <thead class="bg-primary">
//                       <tr>
//                         <th scope="col">Sno</th>
//                         <th scope="col">Room Name</th>
//                         <th scope="col">Room Type</th>
//                         <th scope="col">Charges/Night</th>
//                         <th scope="col">Stay</th>
//                         <th scope="col">Total</th>
//                       </tr>
//                      && booking.customer_info.email</thead>
//                     <tbody>
//                     ${booking.room_info.map(
//                       (room, index) =>
//                         `<tr key="${index}">
//                         <td>${index + 1}</td>
//                         <td>${room.room_name}</td>
//                         <td>${room.room_type}</td>
//                         <td>${room.room_price}</td>
//                         <td>${daysDifference}</td>
//                         <td>${daysDifference * room.room_price}</td>
//                       </tr>`
//                     )}
//                     </tbody>
//                   </table>
//             </div>
//             <div class="Extra Services">
//                 <h6> Extra Service details </h6>
//                 <table class="table">
//                     <thead class="bg-primary">
//                       <tr>
//                         <th scope="col">Sno</th>
//                         <th scope="col">Service Name</th>
//                         <th scope="col">Service Quanity</th>
//                         <th scope="col">Charges/Night</th>
//                         <th scope="col">Stay</th>
//                         <th scope="col">Total</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                     ${booking.extra_services_info.map(
//                       (detail, index) =>
//                         `<tr key="${index}">
//                         <td>${index + 1}</td>
//                         <td>${detail.service_name}</td>
//                         <td>${detail.service_count}</td>
//                         <td>${detail.service_price}</td>
//                         <td>${daysDifference}</td>
//                         <td>${daysDifference * detail.service_price}</td>
//
//                       </tr>`
//                     )}
//                     </tbody>
//                   </table>
//             </div>
//             <div class="row my-5  d-flex justify-content-between">
//                 <div class="col-6">
//                     <h6> Payment Information </h6>
//                     <div class="row my-3">
//                         <div class="col-6">
//                             <h6>Name</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${booking.customer_info.name}</p>
//                         </div>
//                         <div class="col-6">
//                             <h6>Mode of payment</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${booking.mode_of_payment}</p>
//                         </div>
//                         <div class="col-6">
//                             <h6>Transaction ID</h6>
//                         </div>
//                         <div class="col-6">
//                             <p>${booking.transaction_id}</p>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="col-3 d-flex justy-content-end">
//                     <div class="row my-3">
//                         <div class="col-6 ">
//                             <p>Amount</p>
//                         </div>
//                         <div class="col-3 d-flex justify-content-end ">
//                             <p> ₹${booking.billing_info.total_Cost}.00</p>
//                         </div>
//                         <div class="col-6">
//                             <p>Discount</p>
//                         </div>
//                         <div class="col-3 d-flex justify-content-end">
//                             <p> ₹${booking.billing_info.discount}.00</p>
//                         </div>
//                         <div class="col-6">
//                             <p>CGST (%)</p>
//                         </div>
//                         <div class="col-3 d-flex justify-content-end">
//                             <p> ${booking.billing_info.cgst}</p>
//                         </div>
//                         <div class="col-6">
//                             <p>SGST (%)</p>
//                         </div>
//                         <div class="col-3 d-flex justify-content-end">
//                             <p> ${booking.billing_info.sgst}</p>
//                         </div>
//
//                         <div class="col-6">
//                            <p>IGST (%)</p>
//                        </div>
//                         <div class="col-3 d-flex justify-content-end">
//                            <p> ${booking.billing_info.igst}</p>
//                        </div>
//                        <div class="col-9">
//                        ________________________
//                        </div>
//                         <div class="col-6">
//                             <h6>Amount</h6>
//                         </div>
//                         <div class="col-3 d-flex justify-content-end">
//                             <h6> ₹${
//                               booking.billing_info?.amount_payable
//                             }.00</h6>
//                         </div>
//
//                     </div>
//                 </div>
//             </div>
//
//             <div class="thanks">
//                 <p class="text-center display-5">Thank you for Booking with us</p>
//             </div>
//
//         </section>
//
//         <!-- Bootstrap JS and Popper.js -->
//         <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
//         <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
//         <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
//     </body>
//
//     </html>`;
//     }
//     // Create a new page
//     const page = await browser.newPage();
//
//
//     await page.setContent(invoiceHTML);
//
//     // Generate PDF
//     await page.pdf({
//       path:outputFilePath,
//       format: "A4",
//       printBackground: true,
//     });
//
//     // Close the browser
//     await browser.close();
//     if(booking.customer_info !== undefined && booking.customer_info !== null && booking.customer_info !== ""){
//           await sendEmail(booking,outputFilePath)
//     }
//     //  await uploadImage('invoice.pdf')
//     return outputFilePath;
//   }
// };


async function sendEmail (booking,attachmentFilename)  {
  if (booking.customer_info.email) {

    const transporter = nodemailer.createTransport({
      // host: process.env.SMTP_HOST,
      // port: process.env.SMTP_PORT,
      service: 'gmail',
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // console.log("booking.booking_status",booking.booking_status);

//     var mailOptions = {
//       from:'HatimiRetreats<backend@hatimiretreats.com>',
//       to: booking.customer_info.email,
//       subject: "Thank You for Choosing Hatimi Retreats",
//       text: `Dear ${booking.customer_info.name},
//
// Thank you for booking with us! We're excited to welcome you to Hatimi Retreats.
//
// Here are your booking details:
//
// Reservation ID: ${booking.booking_id}
// Check-in: ${booking.check_in}
// Check-out: ${booking.check_out}
// Attached is your invoice for your reference.
//
// If you have any questions or special requests, feel free to reach out.
//
// We can't wait to make your stay memorable!.
//
// Thanks & Regards
// Hatimi Retreats,
// Contact: 7506305353`,
//
//     };

var mailOptions = {
    from: 'Hatimi Retreats <mailto:backend@hatimiretreats.com>',
    to: booking.customer_info.email,
    subject: "Thank You for Choosing Hatimi Retreats",
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <style>
            p {
                font-size: 18px;
                font-weight: 400;
                margin-top: 40px
            }
            .fontStyle {
                font-size: 22px;
                font-weight: 500;
            }
            .container {
                padding: 25px;
                font-family: Arial, sans-serif;
            }
            .imgLogo img {
                max-width: 150px;
                height: auto;
            }
            .content {
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="imgLogo">
                <img src="https://hatimi-production.s3.us-east-1.amazonaws.com/logos/hatimilogo.png" alt="Hatimi Retreats Logo" />
            </div>
            <div class="content">
                <p>Dear ${booking.customer_info.name},<br><br>
                <span class="fontStyle">Thank you for booking with us!</span><br><br>
                We're excited to welcome you to Hatimi Retreats.<br><br><br>
                Here are your booking details:<br><br>
                Reservation ID: ${booking.booking_id}<br>
                Check-in: ${booking.check_in}<br>
                Check-out: ${booking.check_out}<br><br>
                Attached is your invoice for your reference.<br><br><br>
                If you have any questions or special requests, feel free to reach out.<br><br>
                Thanks & Regards,<br>
                Hatimi Retreats<br>
                Contact: +91 7506305353</p>
            </div>
        </div>
    </body>
    </html>
    `,
};


    if(booking.booking_status !== 'blocked'){
      mailOptions.attachments = [
        {
          filename: "invoice.pdf",
          contentType: "application/pdf",
          path: attachmentFilename,
        },
      ]
    }


  //   if(booking.booking_status == 'blocked'){
  //     var mailOptions = {
  //       from:'HatimiRetreats<backend@hatimiretreats.com>',
  //       to: booking.customer_info.email,
  //       subject: "Thank You for Choosing Hatimi Retreats",
  //       text: `Dear ${booking.customer_info.name},
  //
  // Thank you for booking with us! We're excited to welcome you to Hatimi Retreats.
  //
  // Here are your booking details:
  //
  // Reservation ID: ${booking.booking_id}
  // Check-in: ${booking.check_in}
  // Check-out: ${booking.check_out}
  // Attached is your invoice for your reference.
  //
  // If you have any questions or special requests, feel free to reach out.
  //
  // We can't wait to make your stay memorable!.
  //
  // Thanks & Regards
  // Hatimi Retreats,
  // Contact: 7506305353`,
  //       // attachments: [
  //       //   {
  //       //     filename: "invoice.pdf",
  //       //     contentType: "application/pdf",
  //       //     path: attachmentFilename,
  //       //   },
  //       // ],
  //     };
  //   }else{
  //     var mailOptions = {
  //       from:'HatimiRetreats<backend@hatimiretreats.com>',
  //       to: booking.customer_info.email,
  //       subject: "Thank You for Choosing Hatimi Retreats",
  //       text: `Dear ${booking.customer_info.name},
  //
  // Thank you for booking with us! We're excited to welcome you to Hatimi Retreats.
  //
  // Here are your booking details:
  //
  // Reservation ID: ${booking.booking_id}
  // Check-in: ${booking.check_in}
  // Check-out: ${booking.check_out}
  // Attached is your invoice for your reference.
  //
  // If you have any questions or special requests, feel free to reach out.
  //
  // We can't wait to make your stay memorable!.
  //
  // Thanks & Regards
  // Hatimi Retreats,
  // Contact: 7506305353`,
  //       attachments: [
  //         {
  //           filename: "invoice.pdf",
  //           contentType: "application/pdf",
  //           path: attachmentFilename,
  //         },
  //       ],
  //     };
  //   }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("Error sending email:", error);
      }
      console.log("Email sent successfully:", info.response);
    });
  }
};


async function sendManagerEmail (email,booking,attachmentFilename)  {
  // if (booking.customer_info.email) {


  var type = booking.room_info
  var typearray = []
  if(type.length > 0){
    for(let i=0;i<type.length;i++){
      typearray.push(type[i].room_type)
    }
  }

    const transporter = nodemailer.createTransport({
      // host: process.env.SMTP_HOST,
      // port: process.env.SMTP_PORT,
      service: 'gmail',
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from:'HatimiRetreats<backend@hatimiretreats.com>',
      to: email,
      subject: "Booking Details Of Customer",
      html:`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Template</title>
            <style>
                p {
                    font-size: 18px;
                    font-weight: 400;
                    margin-top: 40px
                }
                .fontStyle {
                    font-size: 22px;
                    font-weight: 500;
                }
                .container {
                    padding: 25px;
                    font-family: Arial, sans-serif;
                }
                .imgLogo img {
                    max-width: 150px;
                    height: auto;
                }
                .content {
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="imgLogo">
                    <img src="https://hatimi-production.s3.us-east-1.amazonaws.com/logos/hatimilogo.png" alt="Hatimi Retreats Logo" />
                </div>
                <div class="content">
                    <p>Hello,<br><br>

                        We are excited to inform you that a new booking has been made for one of your property.<br><br>
                        Here are the details of the booking:<br><br>

                        Customer Name: ${booking.customer_info.name}<br>
                        Check_in: ${booking.check_in}<br>
                        Check_out:${booking.check_out}<br>
                        Rooms_book:${type.length}<br>
                        Room Type: ${typearray}<br>
                        Property: ${booking.property_name}<br><br>

                        Thank you,<br>
                        Hatimi Retreats Booking System</p>
                </div>
            </div>
        </body>
        </html>`,
//       text: `Hello,
//
// We are excited to inform you that a new booking has been made for one of your property.
// Here are the details of the booking:
//
// Customer Name: ${booking.customer_info.name}
// Check_in: ${booking.check_in}
// Check_out:${booking.check_out}
// Rooms_book:${type.length}
// Room Type: ${typearray}
// Property: ${booking.property_name}
//
// Thank you,
// Hatimi Retreats Booking System`,
      attachments: [
        {
          filename: "invoice.pdf",
          contentType: "application/pdf",
          path: attachmentFilename,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("Error sending email:", error);
      }
      console.log("Email sent successfully:", info.response);
    });
  // }
};

//
// exports.sendEmail = async (booking, attachmentFilename) => {
//   if (booking.customer_info.email) {
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       secure: false, // true for 465, false for other ports
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//     const mailOptions = {
//       from: "lucienne.ebert52@ethereal.email",
//       to: booking.customer_info.email,
//       subject: "Thank You for Choosing Hatimi Retreats",
//       text: `Dear ${booking.customer_info.name},
//
//           Thank you for booking with us! We're excited to welcome you to Hatimi Retreats.
//
//           Here are your booking details:
//
//             Reservation ID: ${booking.booking_id}
//             Check-in: ${booking.check_in}
//             Check-out: ${booking.check_out}
//             Attached is your invoice for your reference.
//
//           If you have any questions or special requests, feel free to reach out.
//
//           We can't wait to make your stay memorable!.
//
//           Thanks & Regards
//           Hatimi Retreats,
//           Contact: 7506305353`,
//       attachments: [
//         {
//           filename: "invoice.pdf",
//           contentType: "application/pdf",
//           path: attachmentFilename,
//         },
//       ],
//     };
//
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         return console.error("Error sending email:", error);
//       }
//       console.log("Email sent successfully:", info.response);
//     });
//   }
// };

exports.updatedInvoice = async (booking) => {
  // console.log("booking invoice",booking);
  if (booking !== undefined && booking !== null && booking !== "") {


    // console.log('booking=====',booking);
    // Launch a headless browser
    const startDate = booking.check_in;
    const endDate = booking.check_out;
    const companyDetails = await Company.findOne();


    // Calculate the difference in days
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const daysDifference = endMoment.diff(startMoment, "days");

    const browser = await puppeteer.launch({
      headless: "new",
      ignoreDefaultArgs: ["--disable-extensions"],
      args: ["--no-sandbox"],
    }); // Create a new page

    var check_in = formatDate(booking.check_in)
    var check_out = formatDate(booking.check_out)

    var bookingdate = booking.createdAt
    var date = bookingdate.toISOString().split("T")[0]
    var formateddate = formatDate(date)

        if(booking.mode_of_payment == undefined || booking.mode_of_payment == null){
          booking.mode_of_payment = ""
        }


        if(booking.transaction_id == undefined || booking.transaction_id == null){
          booking.transaction_id = ""
        }


    if(booking.customer_info == undefined || booking.customer_info == null || booking.customer_info == ""){
      var invoiceHTML = `<!DOCTYPE html>
  <html lang="en">

  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
      <link rel="stylesheet" type="text/css" href="style.css"> <!-- Replace "your_stylesheet.css" with your actual stylesheet path -->
  </head>

  <body>
      <section class="container-fluid px-5 mt-5">
          <div class="invoice mb-5">
              <h2>Tax Invoice</h2>
          </div>
          <div class="row">
              <div class="col-6 border-right">
                  <img src="https://hatimi.s3.amazonaws.com/frontendpropertyImages/hatimi+logo.png" alt="" class="logo">
                  <div class="address py-3 m-0">
                      <p class="m-0">Fort Mumbai, 400001.</p>
                      <p class="m-0">Contact - +91 9820834976</p>
                      <p class="m-0">${booking.property_name} - ${
    booking.phone_number
  }</p>
                  </div>
              </div>
              <div class="col-6 d-flex align-items-end">
                  <div class="row  px-3">
                      <div class="col-6">
                          <h6>Invoice No</h6>
                      </div>
                      <div class="col-6">
                          <p>${booking.booking_id}</p>
                      </div>
                      <div class="col-6">
                          <h6>CIN.</h6>
                      </div>
                      <div class="col-6">
                          <p>${companyDetails.cin}</p>
                      </div>
                      <div class="col-6">
                          <h6>GST No.</h6>
                      </div>
                      <div class="col-6">
                          <p>${companyDetails.gstin}</p>
                      </div>
                      <div class="col-6">
                          <h6>HSN Code</h6>
                      </div>
                      <div class="col-6">
                          <p>${companyDetails.hsn}</p>
                      </div>
                  </div>

              </div>
          </div>
          <div class="row my-5 border rounded">
              <div class="col-6 my-3">
                  <h5>Guest Information</h5>
                  <div class="my-3 d-flex align-items-end">
                      <div class="row">
                          <div class="col-6">
                              <h6>ITS</h6>
                          </div>
                          <div class="col-6">
                              <p>${companyDetails.its}</p>
                          </div>
                          <div class="col-6">
                              <h6>Name</h6>
                          </div>
                          <div class="col-6">
                          </div>
                          <div class="col-6">
                              <h6>Address</h6>
                          </div>
                          <div class="col-6">
                              <p>${companyDetails.office_address}</p>
                          </div>
                          <div class="col-6">
                              <h6>Email Id</h6>
                          </div>
                          <div class="col-6">
                          </div>
                          <div class="col-6">
                              <h6>Phone No.</h6>
                          </div>
                          <div class="col-6">

                          </div>
                      </div>

                  </div>

              </div>
              <div class="col-6 my-3">
                  <h5>Booking Information</h5>
                  <div class=" my-3 d-flex align-items-end">
                      <div class="row">
                          <div class="col-6">
                              <h6>Property Name</h6>
                          </div>
                          <div class="col-6">
                              <p>${booking.property_name}</p>
                          </div>
                          <div class="col-6">
                              <h6>Booking date</h6>
                          </div>
                          <div class="col-6">
                              <p>${formateddate}</p>
                          </div>
                          <div class="col-6">
                              <h6>Booking ID</h6>
                          </div>
                          <div class="col-6">
                              <p>${booking.booking_id}</p>
                          </div>
                          <div class="col-6">
                              <h6>No of Rooms</h6>
                          </div>
                          <div class="col-6">
                              <p>${booking.number_of_rooms}</p>
                          </div>
                          <div class="col-6">
                              <h6>Check In Date</h6>
                          </div>
                          <div class="col-6">
                              <p>${check_in}</p>
                          </div>
                          <div class="col-6">
                          <h6>Check out Date</h6>
                      </div>
                      <div class="col-6">
                          <p>${check_out}</p>
                      </div>
                      <div class="col-6">
                      <h6>Stay</h6>
                  </div>
                  <div class="col-6">
                      <p>${daysDifference}</p>
                  </div>
                  <div class="col-6">
                      <h6>No of Persons</h6>
                  </div>
                  <div class="col-6">
                      <p>${booking.adults} Adults | ${
    booking.children
  } Childrens </p>
                  </div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="Accommodation">
              <h6>Accommodation details</h6>
              <table class="table">
                  <thead class="bg-primary">
                    <tr>
                      <th scope="col">Sno</th>
                      <th scope="col">Room Name</th>
                      <th scope="col">Room Type</th>
                      <th scope="col">Charges/Night</th>
                      <th scope="col">Stay</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                  ${booking.room_info.map(
                    (room, index) =>
                      `<tr key="${index}">
                      <td>${index + 1}</td>
                      <td>${room.room_name}</td>
                      <td>${room.room_type}</td>
                      <td>${room.room_price}</td>
                      <td>${daysDifference}</td>
                      <td>${daysDifference * room.room_price}</td>
                    </tr>`
                  )}
                  </tbody>
                </table>
          </div>
          <div class="Extra Services">
              <h6> Extra Service details </h6>
              <table class="table">
                  <thead class="bg-primary">
                    <tr>
                      <th scope="col">Sno</th>
                      <th scope="col">Service Name</th>
                      <th scope="col">Service Quanity</th>
                      <th scope="col">Charges/Night</th>
                      <th scope="col">Stay</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                  ${booking.extra_services_info.map(
                    (detail, index) =>
                      `<tr key="${index}">
                      <td>${index + 1}</td>
                      <td>${detail.service_name}</td>
                      <td>${detail.service_count}</td>
                      <td>${detail.service_price}</td>
                      <td>${daysDifference}</td>
                      <td>${daysDifference * detail.service_price}</td>

                    </tr>`
                  )}
                  </tbody>
                </table>
          </div>
          <div class="row my-5  d-flex justify-content-between">
              <div class="col-6">
                  <h6> Payment Information </h6>
                  <div class="row my-3">
                      <div class="col-6">
                          <h6>Name</h6>
                      </div>
                      <div class="col-6">

                      </div>
                      <div class="col-6">
                          <h6>Mode of payment</h6>
                      </div>
                      <div class="col-6">
                          <p>${booking.mode_of_payment}</p>
                      </div>
                      <div class="col-6">
                          <h6>Transaction ID</h6>
                      </div>
                      <div class="col-6">
                          <p>${booking.transaction_id}</p>
                      </div>
                  </div>
              </div>
              <div class="col-3 d-flex justy-content-end">
                  <div class="row my-3">
                      <div class="col-6 ">
                          <p>Amount</p>
                      </div>
                      <div class="col-3 d-flex justify-content-end ">
                          <p> ₹${booking.billing_info.total_Cost}.00</p>
                      </div>
                      <div class="col-6">
                          <p>Discount</p>
                      </div>
                      <div class="col-3 d-flex justify-content-end">
                          <p> ₹${booking.billing_info.discount}.00</p>
                      </div>


                      <div class="col-6">
                          <p>CGST (%)</p>
                      </div>
                      <div class="col-3 d-flex justify-content-end">
                          <p> ${booking.billing_info.cgst}</p>
                      </div>


                      <div class="col-6">
                          <p>SGST (%)</p>
                      </div>
                      <div class="col-3 d-flex justify-content-end">
                          <p> ${booking.billing_info.sgst}</p>
                      </div>

                      <div class="col-6">
                         <p>IGST (%)</p>
                     </div>
                      <div class="col-3 d-flex justify-content-end">
                         <p> ${booking.billing_info.igst}</p>
                     </div><div class="col-9 mt-0"> _____________________</div>

                      <div class="col-6">
                          <h6>Amount</h6>
                      </div>
                      <div class="col-3 d-flex justify-content-end">
                          <h6> ₹${
                            booking.billing_info?.amount_payable
                          }.00</h6>
                      </div>

                  </div>
              </div>
          </div>

          <div class="thanks">
              <p class="text-center display-5">Thank you for Booking with us</p>
          </div>

      </section>

      <!-- Bootstrap JS and Popper.js -->
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
  </body>

  </html>`;
    }else{
      var invoiceHTML = `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <link rel="stylesheet" type="text/css" href="style.css"> <!-- Replace "your_stylesheet.css" with your actual stylesheet path -->
    </head>

    <body>
        <section class="container-fluid px-5 mt-5">
            <div class="invoice mb-5">
                <h2>Tax Invoice</h2>
            </div>
            <div class="row">
                <div class="col-6 border-right">
                    <img src="https://hatimi.s3.amazonaws.com/frontendpropertyImages/hatimi+logo.png" alt="" class="logo">
                    <div class="address py-3 m-0">
                        <p class="m-0">Fort Mumbai, 400001.</p>
                        <p class="m-0">Contact - +91 9820834976</p>
                        <p class="m-0">${booking.property_name} - ${
      booking.phone_number
    }</p>
                    </div>
                </div>
                <div class="col-6 d-flex align-items-end">
                    <div class="row  px-3">
                        <div class="col-6">
                            <h6>Invoice No</h6>
                        </div>
                        <div class="col-6">
                            <p>${booking.booking_id}</p>
                        </div>
                        <div class="col-6">
                            <h6>CIN.</h6>
                        </div>
                        <div class="col-6">
                            <p>${companyDetails.cin}</p>
                        </div>
                        <div class="col-6">
                            <h6>GST No.</h6>
                        </div>
                        <div class="col-6">
                            <p>${companyDetails.gstin}</p>
                        </div>
                        <div class="col-6">
                            <h6>HSN Code</h6>
                        </div>
                        <div class="col-6">
                            <p>${companyDetails.hsn}</p>
                        </div>
                    </div>

                </div>
            </div>
            <div class="row my-5 border rounded">
                <div class="col-6 my-3">
                    <h5>Guest Information</h5>
                    <div class="my-3 d-flex align-items-end">
                        <div class="row">
                            <div class="col-6">
                                <h6>ITS</h6>
                            </div>
                            <div class="col-6">
                                <p>${companyDetails.its}</p>
                            </div>
                            <div class="col-6">
                                <h6>Name</h6>
                            </div>
                            <div class="col-6">
                            <p>${booking.customer_info.name}</p>
                            </div>
                            <div class="col-6">
                                <h6>Address</h6>
                            </div>
                            <div class="col-6">
                                <p>${companyDetails.office_address}</p>
                            </div>
                            <div class="col-6">
                                <h6>Email Id</h6>
                            </div>
                            <div class="col-6">
                                <p>${booking.customer_info.email}</p>
                            </div>
                            <div class="col-6">
                                <h6>Phone No.</h6>
                            </div>
                            <div class="col-6">
                            <p>${booking.customer_info.mobile_number}</p>
                            </div>
                        </div>

                    </div>

                </div>
                <div class="col-6 my-3">
                    <h5>Booking Information</h5>
                    <div class=" my-3 d-flex align-items-end">
                        <div class="row">
                            <div class="col-6">
                                <h6>Property Name</h6>
                            </div>
                            <div class="col-6">
                                <p>${booking.property_name}</p>
                            </div>
                            <div class="col-6">
                                <h6>Booking date</h6>
                            </div>
                            <div class="col-6">
                                <p>${formateddate}</p>
                            </div>
                            <div class="col-6">
                                <h6>Booking ID</h6>
                            </div>
                            <div class="col-6">
                                <p>${booking.booking_id}</p>
                            </div>
                            <div class="col-6">
                                <h6>No of Rooms</h6>
                            </div>
                            <div class="col-6">
                                <p>${booking.number_of_rooms}</p>
                            </div>
                            <div class="col-6">
                                <h6>Check In Date</h6>
                            </div>
                            <div class="col-6">
                                <p>${check_in}</p>
                            </div>
                            <div class="col-6">
                            <h6>Check out Date</h6>
                        </div>
                        <div class="col-6">
                            <p>${check_out}</p>
                        </div>
                        <div class="col-6">
                        <h6>Stay</h6>
                    </div>
                    <div class="col-6">
                        <p>${daysDifference}</p>
                    </div>
                    <div class="col-6">
                        <h6>No of Persons</h6>
                    </div>
                    <div class="col-6">
                        <p>${booking.adults} Adults | ${
      booking.children
    } Childrens </p>
                    </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="Accommodation">
                <h6>Accommodation details</h6>
                <table class="table">
                    <thead class="bg-primary">
                      <tr>
                        <th scope="col">Sno</th>
                        <th scope="col">Room Name</th>
                        <th scope="col">Room Type</th>
                        <th scope="col">Charges/Night</th>
                        <th scope="col">Stay</th>
                        <th scope="col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                    ${booking.room_info.map(
                      (room, index) =>
                        `<tr key="${index}">
                        <td>${index + 1}</td>
                        <td>${room.room_name}</td>
                        <td>${room.room_type}</td>
                        <td>${room.room_price}</td>
                        <td>${daysDifference}</td>
                        <td>${daysDifference * room.room_price}</td>
                      </tr>`
                    )}
                    </tbody>
                  </table>
            </div>
            <div class="Extra Services">
                <h6> Extra Service details </h6>
                <table class="table">
                    <thead class="bg-primary">
                      <tr>
                        <th scope="col">Sno</th>
                        <th scope="col">Service Name</th>
                        <th scope="col">Service Quanity</th>
                        <th scope="col">Charges/Night</th>
                        <th scope="col">Stay</th>
                        <th scope="col">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                    ${booking.extra_services_info.map(
                      (detail, index) =>
                        `<tr key="${index}">
                        <td>${index + 1}</td>
                        <td>${detail.service_name}</td>
                        <td>${detail.service_count}</td>
                        <td>${detail.service_price}</td>
                        <td>${daysDifference}</td>
                        <td>${daysDifference * detail.service_price}</td>

                      </tr>`
                    )}
                    </tbody>
                  </table>
            </div>
            <div class="row my-5  d-flex justify-content-between">
                <div class="col-6">
                    <h6> Payment Information </h6>
                    <div class="row my-3">
                        <div class="col-6">
                            <h6>Name</h6>
                        </div>
                        <div class="col-6">
                        <p>${booking.customer_info.name}</p>
                        </div>
                        <div class="col-6">
                            <h6>Mode of payment</h6>
                        </div>
                        <div class="col-6">
                            <p>${booking.mode_of_payment}</p>
                        </div>
                        <div class="col-6">
                            <h6>Transaction ID</h6>
                        </div>
                        <div class="col-6">
                            <p>${booking.transaction_id}</p>
                        </div>
                    </div>
                </div>
                <div class="col-3 d-flex justy-content-end">
                    <div class="row my-3">
                        <div class="col-6 ">
                            <p>Amount</p>
                        </div>
                        <div class="col-3 d-flex justify-content-end ">
                            <p> ₹${booking.billing_info.total_Cost}.00</p>
                        </div>
                        <div class="col-6">
                            <p>Discount</p>
                        </div>
                        <div class="col-3 d-flex justify-content-end">
                            <p> ₹${booking.billing_info.discount}.00</p>
                        </div>


                        <div class="col-6">
                            <p>CGST (%)</p>
                        </div>
                        <div class="col-3 d-flex justify-content-end">
                            <p> ${booking.billing_info.cgst}</p>
                        </div>


                        <div class="col-6">
                            <p>SGST (%)</p>
                        </div>
                        <div class="col-3 d-flex justify-content-end">
                            <p> ${booking.billing_info.sgst}</p>
                        </div>

                        <div class="col-6">
                           <p>IGST (%)</p>
                       </div>
                        <div class="col-3 d-flex justify-content-end">
                           <p> ${booking.billing_info.igst}</p>
                       </div><div class="col-9 mt-0"> _____________________</div>
                        <div class="col-6">
                            <h6>Amount</h6>
                        </div>
                        <div class="col-3 d-flex justify-content-end">
                            <h6> ₹${
                              booking.billing_info?.amount_payable
                            }.00</h6>
                        </div>

                    </div>
                </div>
            </div>

            <div class="thanks">
                <p class="text-center display-5">Thank you for Booking with us</p>
            </div>

        </section>

        <!-- Bootstrap JS and Popper.js -->
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </body>

    </html>`;
    }

    const page = await browser.newPage();
    const outputPath = path.join(__dirname, "../public/updateinvoice/");
    const outputFile = Date.now() + "_" + "updateinvoice.pdf";
    const outputFilePath = path.join(outputPath, outputFile);

    await page.setContent(invoiceHTML);

    // Generate PDF
    await page.pdf({
      path: path.join(outputPath, outputFile),
      format: "A4",
      printBackground: true,
    });

    // Close the browser
    await browser.close();


    //Remove the temporary file
    // fs.unlink(outputFilePath, (err) => {
    //   if (err) {
    //     console.error(`Error removing file ${outputFilePath}:`, err);
    //   } else {
    //     console.log(`File ${outputFilePath} removed successfully`);
    //   }
    // });


    return outputFilePath
  }
};
