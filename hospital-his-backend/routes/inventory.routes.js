const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items
 */
router.get('/', authorize('admin'), inventoryController.getAllItems);

/**
 * @route   POST /api/inventory
 * @desc    Add new inventory item
 */
router.post('/', authorize('admin'), inventoryController.addItem);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory item
 */
router.put('/:id', authorize('admin'), inventoryController.updateItem);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete inventory item
 */
router.delete('/:id', authorize('admin'), inventoryController.deleteItem);

/**
 * @route   POST /api/inventory/stock-in
 * @desc    Record stock in
 */
router.post('/stock-in', authorize('admin'), inventoryController.stockIn);

/**
 * @route   POST /api/inventory/stock-out
 * @desc    Record stock out
 */
router.post('/stock-out', authorize('admin'), inventoryController.stockOut);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get low stock items
 */
router.get('/low-stock', authorize('admin'), inventoryController.getLowStockItems);

/**
 * @route   GET /api/inventory/transactions
 * @desc    Get inventory transactions
 */
router.get('/transactions', authorize('admin'), inventoryController.getTransactions);

module.exports = router;
