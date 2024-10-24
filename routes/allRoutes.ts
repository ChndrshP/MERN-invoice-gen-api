import express from 'express';
import asyncHandler from 'express-async-handler';
import { registerUser, loginUser} from '../controllers/authController';
import { generatePDF } from "../controllers/pdfController";
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  await registerUser(req, res);
}));

router.post('/login', asyncHandler(async (req, res) => {
  await loginUser(req, res);
}));

router.post("/generate-pdf", protect, asyncHandler(async (req, res) => {
  await generatePDF(req, res);
}));

export default router;