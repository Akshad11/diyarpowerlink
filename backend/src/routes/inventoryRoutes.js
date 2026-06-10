import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listGrns, createGrn, updateGrn, deleteGrn,
  listAdjustments, createAdjustment, updateAdjustment, deleteAdjustment,
  listStockLedger
} from '../controllers/inventoryController.js';

const router = express.Router();

// Apply auth middleware to all inventory routes
router.use(requireAuth);

// Goods Receipt Notes (GRN)
router.get('/grns', listGrns);
router.post('/grns', createGrn);
router.put('/grns/:id', updateGrn);
router.delete('/grns/:id', deleteGrn);

// Stock Adjustments
router.get('/adjustments', listAdjustments);
router.post('/adjustments', createAdjustment);
router.put('/adjustments/:id', updateAdjustment);
router.delete('/adjustments/:id', deleteAdjustment);

// Stock Ledger logs
router.get('/ledger', listStockLedger);

export default router;
