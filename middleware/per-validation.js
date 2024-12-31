const Joi = require("joi");

module.exports = (validationSchema = null) => {
  return async (req, res, next) => {
    try {
      if (!validationSchema) {
        return next();
      }
      const joiSchema = validationSchemas[validationSchema];
      if (!joiSchema) {
        console.info("no schema found bypassed.");
        return next();
      }
      req.body = await joiSchema.validateAsync(req.body);
      next();
    } catch (error) {
      return res.status(200).send({
        status: false,
        error: error.details.map((err) => err.message),
      });
    }
  };
};

const validationSchemas = {};

validationSchemas.register = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),

  email: Joi.string().email().required(),

  password: Joi.string()
    .min(4)
    .max(10)
    .regex(/^[a-zA-Z0-9]{3,30}$/)
    .required(),

  role: Joi.string().min(4).max(15).required(),
});

validationSchemas.login = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().min(4).max(10).required(),
});

validationSchemas.changePassword = Joi.object({
  password: Joi.string().min(4).max(10).required(),

  newPassword: Joi.string().min(4).max(10).required(),
});
validationSchemas.bookingData = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref("startDate")).required(),
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).required(),
  no_of_rooms: Joi.number().integer().min(1).required(),
});




validationSchemas.bookingDatesSchema = Joi.object({
  property_uid: Joi.string().required(),
  room_info: Joi.array()
    .items(
      Joi.object({
        room_type: Joi.string().required(),
        room_count: Joi.number().integer().min(1).required(),
        room_price: Joi.number().positive().required(),
        single_room_price: Joi.number().positive().required(),
        max_guest_occupancy: Joi.number().positive().required(),
        // min_guest_occupancy: Joi.number().positive().required(),
        // room_count_new: Joi.number().integer().min(1).required(),
        // room_count: Joi.number().positive().required(),
        extra_services: Joi.array()
          .items(
            Joi.object({
              service_count: Joi.number().integer().min(1).required(),
              service_name: Joi.string().required(),
              service_price: Joi.number().positive().required(),
              single_service_price: Joi.number().positive().required(),
              service_days: Joi.number().positive().required(),
            })
          )
          .optional()
      })
    )
    .min(1)
    .required(),
  check_in: Joi.date().required(),
  check_out: Joi.date().min(Joi.ref("check_in")).required(),
  number_of_rooms: Joi.number().integer().min(1).required(),
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).optional(),
  coupon_code: Joi.string().allow("").optional(),
  order:Joi.string().allow("").optional(),
  payment_id:Joi.string().allow("").optional(),
  invoice_id:Joi.string().allow("").optional(),
  transaction_id:Joi.string().allow("").optional(),
  mode_of_payment:Joi.string().allow("").optional(),
  customer_id:Joi.string().allow("").optional(),
  signature:Joi.string().allow("").optional(),
  extra_services_info: Joi.array()
    .items(
      Joi.object({
        service_count: Joi.number().integer().min(1).required(),
        service_name: Joi.string().required(),
        service_price: Joi.number().positive().required(),
        single_service_price: Joi.number().positive().required(),
        service_days: Joi.number().positive().required(),
      })
    )
    .optional(),
  customer_info: Joi.object({
    name: Joi.string().required(),
    mobile_number: Joi.string()
      .allow("")
      .optional(),
    // mobile_number: Joi.number()
    //   .integer()
    //   .optional(),
    email: Joi.string().allow("").optional(),
    purpose_of_visit: Joi.string().allow("").optional(),
    company_name: Joi.string().allow("").optional(),
    company_gst: Joi.string().allow("").optional(),
    itsID: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
  })
    .allow({})
    .optional(),
  billing_info: Joi.object({
    total_Cost: Joi.number().positive().required(),
    discount: Joi.number().allow("").optional(),
    sgst: Joi.number().required(),
    cgst: Joi.number().required(),
    igst:Joi.number(),

    amount_payable: Joi.number().positive().required(),
  })
    .allow({})
    .optional(),
  isBlockRoom: Joi.boolean().optional(),
  gst_data: Joi.object({
    cgst_percent:Joi.number().allow("",null).optional(),
    sgst_percent:Joi.number().allow("",null).optional(),
    igst_percent:Joi.number().allow("",null).optional()
  })
  .allow({})
  .optional()
});
