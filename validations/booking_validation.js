const { body } = require("express-validator");

const validateBookingPayload = [
  body("property_uid").notEmpty().withMessage("Property UID is required"),

  // Validate room_info
  body("room_info")
    .isArray({ min: 1 })
    .withMessage("At least one room information is required"),
  body("room_info.*.room_type")
    .isString()
    .withMessage("Room type must be a string"),
  body("room_info.*.room_count")
    .isInt({ min: 1 })
    .withMessage("Room count must be at least 1"),

  // Validate check_in and check_out
  body("check_in").isDate().withMessage("Invalid check-in date format"),
  body("check_out").isDate().withMessage("Invalid check-out date format"),

  // Validate number_of_rooms, adults, and children
  body("number_of_rooms")
    .isInt({ min: 1 })
    .withMessage("Number of rooms must be at least 1"),
  body("adults")
    .isInt({ min: 0 })
    .withMessage("Number of adults cannot be negative"),
  body("children")
    .isInt({ min: 0 })
    .withMessage("Number of children cannot be negative"),

  // Validate extra_services_info
  body("extra_services_info.service_name")
    .optional()
    .isString()
    .withMessage("Service name must be a string"),
  body("extra_services_info.service_price")
    .optional()
    .isNumeric()
    .withMessage("Service price must be a number"),

  // Validate customer_info
  body("customer_info.name")
    .isString()
    .withMessage("Customer name must be a string"),
  body("customer_info.mobile_number")
    .isNumeric()
    .withMessage("Invalid mobile number"),
  body("customer_info.email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),
  body("customer_info.coupon")
    .optional()
    .isString()
    .withMessage("Coupon must be a string"),

  // Validate billing_info
  body("billing_info.total_Cost")
    .isNumeric()
    .withMessage("Total cost must be a number"),
  body("billing_info.discount")
    .optional()
    .isNumeric()
    .withMessage("Discount must be a number"),
  body("billing_info.sgst")
    .optional()
    .isNumeric()
    .withMessage("SGST must be a number"),
  body("billing_info.cgst")
    .optional()
    .isNumeric()
    .withMessage("CGST must be a number"),
  body("billing_info.amount_payable")
    .isNumeric()
    .withMessage("Amount payable must be a number"),
];

module.exports = { validateBookingPayload };
