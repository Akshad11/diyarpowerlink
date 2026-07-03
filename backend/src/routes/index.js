import express from 'express';
import authRoutes from './authRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import cmsRoutes from './cmsRoutes.js';
import crmRoutes from './crmRoutes.js';
import procurementRoutes from './procurementRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import currencyRoutes from './currencyRoutes.js';
import reportRoutes from './reportRoutes.js';
import expenseRoutes from './expenseRoutes.js';

const router = express.Router();

router.use('/', authRoutes);
router.use('/media', mediaRoutes);
router.use('/settings', settingsRoutes);
router.use('/crm', crmRoutes);
router.use('/procurement', procurementRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/currencies', currencyRoutes);
router.use('/reports', reportRoutes);
router.use('/expenses', expenseRoutes);
router.use('/', cmsRoutes);

export default router;
