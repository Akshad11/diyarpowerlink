import { Currency } from '../models/Currency.js';
import { ExchangeRate } from '../models/ExchangeRate.js';

// --- CURRENCIES CRUD ---
export const listCurrencies = async (_req, res) => {
  try {
    const currencies = await Currency.find().sort({ code: 1 });
    res.json(currencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCurrency = async (req, res) => {
  try {
    const currency = await Currency.create(req.body);
    res.json(currency);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCurrency = async (req, res) => {
  try {
    const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(currency);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCurrency = async (req, res) => {
  try {
    await Currency.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- EXCHANGE RATES CRUD ---
export const listExchangeRates = async (_req, res) => {
  try {
    const rates = await ExchangeRate.find().sort({ from: 1 });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExchangeRate = async (req, res) => {
  try {
    const { rate } = req.body;
    const updated = await ExchangeRate.findByIdAndUpdate(req.params.id, { rate }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
