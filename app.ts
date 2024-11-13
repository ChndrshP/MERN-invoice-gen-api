import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/allRoutes';
import cors from 'cors';

dotenv.config();
connectDB();

const corsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
  };
  
const app = express();
app.use(express.json());
app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);

export default app;