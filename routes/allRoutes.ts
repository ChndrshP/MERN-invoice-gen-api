import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { registerUser, loginUser } from '../controllers/authController';
import { generatePDF } from "../controllers/pdfController";
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Register route
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  await registerUser(req, res);
}));

// Login route
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  await loginUser(req, res);
}));

// Generate PDF route (protected)
router.post("/generate-pdf", protect, asyncHandler(async (req: Request, res: Response) => {
  await generatePDF(req, res);
}));

export default router;
