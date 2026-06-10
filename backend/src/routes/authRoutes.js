import express from 'express';
import { login, getDashboardSummary } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/auth/login', login);
router.get('/dashboard/summary', requireAuth, getDashboardSummary);

export default router;
