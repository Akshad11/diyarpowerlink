import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';

const router = express.Router();

// Apply auth middleware to all expense routes
router.use(requireAuth);

router.get('/', listExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
