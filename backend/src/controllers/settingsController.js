import { Settings } from '../models/Settings.js';

export const getSettings = async (_req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const existing = await Settings.findOne();
    if (existing) {
      const updated = await Settings.findByIdAndUpdate(existing._id, req.body, { new: true });
      return res.json(updated);
    }
    res.json(await Settings.create(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
