function errorHandler(err, req, res, next) {
    console.error(`Unhandled error: ${err.message}`);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      timestamp: new Date().toISOString(),
    });
  }
  
  function notFound(req, res) {
    res.status(404).json({
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
  
  module.exports = { errorHandler, notFound };