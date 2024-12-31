 
exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (res.headersSent) {
      return next(err);
    }
  
    let statusCode = 500;
    let statusMessage = 'Internal Server Error';
  
    if (err.statusCode) {
      statusCode = err.statusCode;
      statusMessage = err.statusMessage || 'Unknown Error';
    }
  
    res.status(statusCode).json({ status: false, error: statusMessage });
  };
    