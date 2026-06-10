import { Grn } from '../models/Grn.js';
import { StockLedger } from '../models/StockLedger.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { getNextSequenceNumber } from '../services/sequenceService.js';
import { syncGrnStock, syncAdjustmentStock } from '../services/inventoryService.js';

// --- GOODS RECEIPT NOTES (GRN) ---
export const listGrns = async (_req, res) => {
  try {
    const grns = await Grn.find()
      .populate('purchaseOrder')
      .populate('supplier')
      .sort({ createdAt: -1 });
    res.json(grns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createGrn = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.grnNumber) {
      payload.grnNumber = await getNextSequenceNumber('GRN', Grn, 'grnNumber');
    }
    const created = await Grn.create(payload);

    // If status is received, sync stock, and also update PurchaseOrder status to received
    if (created.status === 'received') {
      await syncGrnStock(created);
      if (created.purchaseOrder) {
        await PurchaseOrder.findByIdAndUpdate(created.purchaseOrder, { status: 'received' });
      }
    }

    const populated = await Grn.findById(created._id)
      .populate('purchaseOrder')
      .populate('supplier');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateGrn = async (req, res) => {
  try {
    const updated = await Grn.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Sync stock ledger on update
    await syncGrnStock(updated);

    // If status becomes received, also update PurchaseOrder status
    if (updated.status === 'received' && updated.purchaseOrder) {
      await PurchaseOrder.findByIdAndUpdate(updated.purchaseOrder, { status: 'received' });
    }

    const populated = await Grn.findById(updated._id)
      .populate('purchaseOrder')
      .populate('supplier');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteGrn = async (req, res) => {
  try {
    const grn = await Grn.findById(req.params.id);
    if (grn) {
      // Set status to draft/cancelled first to trigger stock ledger cleanup
      grn.status = 'cancelled';
      await syncGrnStock(grn);
      await Grn.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- STOCK ADJUSTMENTS ---
export const listAdjustments = async (_req, res) => {
  try {
    const adjustments = await StockAdjustment.find().sort({ createdAt: -1 });
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAdjustment = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.adjustmentNumber) {
      payload.adjustmentNumber = await getNextSequenceNumber('ADJ', StockAdjustment, 'adjustmentNumber');
    }
    const created = await StockAdjustment.create(payload);

    if (created.status === 'adjusted') {
      await syncAdjustmentStock(created);
    }

    res.json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateAdjustment = async (req, res) => {
  try {
    const updated = await StockAdjustment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await syncAdjustmentStock(updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteAdjustment = async (req, res) => {
  try {
    const adj = await StockAdjustment.findById(req.params.id);
    if (adj) {
      adj.status = 'cancelled';
      await syncAdjustmentStock(adj);
      await StockAdjustment.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- STOCK LEDGER AUDIT ---
export const listStockLedger = async (req, res) => {
  try {
    const { itemId } = req.query;
    const filter = itemId ? { item: itemId } : {};
    const ledger = await StockLedger.find(filter)
      .populate('item')
      .sort({ date: -1 });
    res.json(ledger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
