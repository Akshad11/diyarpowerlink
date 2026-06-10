import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listCurrencies, createCurrency, updateCurrency, deleteCurrency,
  listExchangeRates, updateExchangeRate
} from '../controllers/currencyController.js';

const router = express.Router();

// Apply auth middleware to all currency routes
router.use(requireAuth);

// Currencies
router.get('/', listCurrencies);
router.post('/', createCurrency);
router.put('/:id', updateCurrency);
router.delete('/:id', deleteCurrency);

// Exchange Rates
router.get('/rates', listExchangeRates);
router.put('/rates/:id', updateExchangeRate);

export default router;
