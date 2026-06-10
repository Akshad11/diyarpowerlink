import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  listBusinessAreas, createBusinessArea, updateBusinessArea, deleteBusinessArea,
  listServices, createService, updateService, deleteService,
  listPartners, createPartner, updatePartner, deletePartner,
  listMessages, patchMessage, deleteMessage, createPublicMessage,
  listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  seedDefaultsData
} from '../controllers/cmsController.js';

const router = express.Router();

// Categories
router.get('/categories', listCategories);
router.post('/categories', requireAuth, createCategory);
router.put('/categories/:id', requireAuth, updateCategory);
router.delete('/categories/:id', requireAuth, deleteCategory);

// Products
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', requireAuth, createProduct);
router.put('/products/:id', requireAuth, updateProduct);
router.delete('/products/:id', requireAuth, deleteProduct);

// Business Areas
router.get('/business-areas', listBusinessAreas);
router.post('/business-areas', requireAuth, createBusinessArea);
router.put('/business-areas/:id', requireAuth, updateBusinessArea);
router.delete('/business-areas/:id', requireAuth, deleteBusinessArea);

// Services
router.get('/services', listServices);
router.post('/services', requireAuth, createService);
router.put('/services/:id', requireAuth, updateService);
router.delete('/services/:id', requireAuth, deleteService);

// Partners
router.get('/partners', listPartners);
router.post('/partners', requireAuth, createPartner);
router.put('/partners/:id', requireAuth, updatePartner);
router.delete('/partners/:id', requireAuth, deletePartner);

// Messages (Contact Form)
router.get('/messages', requireAuth, listMessages);
router.patch('/messages/:id', requireAuth, patchMessage);
router.delete('/messages/:id', requireAuth, deleteMessage);
router.post('/messages', createPublicMessage); // Public submission

// Admin Users
router.get('/admin-users', requireAuth, listAdminUsers);
router.post('/admin-users', requireAuth, createAdminUser);
router.put('/admin-users/:id', requireAuth, updateAdminUser);
router.delete('/admin-users/:id', requireAuth, deleteAdminUser);

// Seeding DB defaults
router.post('/admin/seed-defaults', requireAuth, seedDefaultsData);

export default router;
