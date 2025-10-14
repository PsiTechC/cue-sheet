
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/table');
const projectRoutes = require('./routes/project');
const path = require('path');
const morgan = require('morgan');
const metadataRoutes = require('./routes/metadata');
const adminRoutes = require('./routes/admin');
const voiceRoutes = require('./routes/voice_over');
const keyRoutes = require('./routes/aws');
const MinutesRoute = require('./routes/userMin');
const { checkLowBalanceEvery10Minutes } = require('./routes/checkLowBalance');
const paymentRoutes = require('./routes/paymentRoutes');
const plansRoutes = require('./routes/plans');
const FetchServices = require('./routes/fetchServices');
const helmet = require('helmet');
const cookieParser = require("cookie-parser");



const app = express();
app.use(cookieParser());

app.use(helmet());
app.use(express.json());

app.use(
  cors({
    origin: process.env.REACT_FE,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.REACT_FE);  
  res.header('Access-Control-Allow-Credentials', 'true');  
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});



app.options('*', cors());

app.use(morgan('combined')); 


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB', err));

checkLowBalanceEvery10Minutes();

app.use('/api/auth', authRoutes); 
app.use('/', tableRoutes);
app.use('/api/project', projectRoutes);

app.use('/api/metadata', metadataRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/admin', adminRoutes);
app.use('/api/voice', voiceRoutes);


app.use('/api/c', MinutesRoute);

app.use('/api/getPlans', FetchServices);

app.use('/api/payment', paymentRoutes);
app.use('/api/add', plansRoutes);

app.use('/api/keys', keyRoutes);
app.get('/', (req, res)=>{
  res.send('new deployed')
})

const PORT = process.env.PORT || 6006;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});



