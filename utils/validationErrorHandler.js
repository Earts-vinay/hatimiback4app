function validationErrorHandler(validationError) {
    const errors = {};
  
    for (const field in validationError.errors) {
      if (validationError.errors.hasOwnProperty(field)) {
        errors[field] = validationError.errors[field].message;
      }
    }
  
    return errors;
  }
module.exports=validationErrorHandler;  