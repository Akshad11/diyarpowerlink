import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getReportsSummary, getProfitLossReport } from '../controllers/reportController.js';

const router = express.Router();

// Apply auth middleware to all report routes
router.use(requireAuth);

// Aggregate report dashboard summary
router.get('/summary', getReportsSummary);

// Profit & Loss statement calculation
router.get('/profit-loss', getProfitLossReport);

export default router;
