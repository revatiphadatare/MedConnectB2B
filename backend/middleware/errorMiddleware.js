const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const code = res.statusCode !== 200 ? res.statusCode : 500;
  if (err.name === 'CastError')
    return res.status(400).json({ success:false, message:'Invalid ID format' });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue||{})[0]||'field';
    return res.status(400).json({ success:false, message:`${field} already exists` });
  }
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e=>e.message).join(', ');
    return res.status(400).json({ success:false, message:msg });
  }
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success:false, message:'Invalid token' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success:false, message:'Token expired' });
  res.status(code).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV==='development' && { stack:err.stack }),
  });
};

module.exports = { notFound, errorHandler };
