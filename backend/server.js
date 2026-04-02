const express   = require('express');
const dotenv    = require('dotenv');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();
require('./config/db')();

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app   = express();
const isDev = process.env.NODE_ENV !== 'production';

// Health — MUST be first
app.get('/',           (_, res) => res.json({ message:'MedChain API is running', health:'/api/health' }));
app.get('/api/health', (_, res) => res.json({ status:'ok', time:new Date().toISOString(), version:'2.0' }));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, cb) => {
    const allowed = ['http://localhost:5173','http://localhost:3000', process.env.CLIENT_URL].filter(Boolean);
    if (!origin || isDev || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked'));
  },
  credentials:true,
  methods:['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders:['Content-Type','Authorization'],
}));
app.use('/api', rateLimit({ windowMs:15*60*1000, max:isDev?5000:500, standardHeaders:true, legacyHeaders:false, message:{ success:false, message:'Too many requests.' } }));
app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true }));
if (isDev) app.use(morgan('dev'));

// All routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/products',      require('./routes/productRoutes'));
app.use('/api/orders',        require('./routes/orderRoutes'));
app.use('/api/invoices',      require('./routes/invoiceRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));
app.use('/api/medicines',     require('./routes/medicineRoutes'));
app.use('/api/batches',       require('./routes/batchRoutes'));
app.use('/api/sales',         require('./routes/saleRoutes'));
app.use('/api/suppliers',     require('./routes/supplierRoutes'));
app.use('/api/customers',     require('./routes/customerRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports',       require('./routes/reportRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`\n✅  MedChain API → http://localhost:${PORT} [${process.env.NODE_ENV||'development'}]\n`)
);

module.exports = app;
