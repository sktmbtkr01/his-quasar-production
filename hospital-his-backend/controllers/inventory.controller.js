const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all inventory items
 * @route   GET /api/inventory
 */
exports.getAllItems = asyncHandler(async (req, res, next) => {
    const { category, page = 1, limit = 50 } = req.query;

    const query = {};
    if (category) query.category = category;

    const skip = (page - 1) * limit;

    const items = await Inventory.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ itemName: 1 });

    const total = await Inventory.countDocuments(query);

    res.status(200).json({
        success: true,
        count: items.length,
        total,
        page: parseInt(page),
        data: items,
    });
});

/**
 * @desc    Add inventory item
 * @route   POST /api/inventory
 */
exports.addItem = asyncHandler(async (req, res, next) => {
    const item = await Inventory.create(req.body);

    res.status(201).json({
        success: true,
        data: item,
    });
});

/**
 * @desc    Update inventory item
 * @route   PUT /api/inventory/:id
 */
exports.updateItem = asyncHandler(async (req, res, next) => {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!item) {
        return next(new ErrorResponse('Item not found', 404));
    }

    res.status(200).json({
        success: true,
        data: item,
    });
});

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/inventory/:id
 */
exports.deleteItem = asyncHandler(async (req, res, next) => {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
        return next(new ErrorResponse('Item not found', 404));
    }

    await item.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Item deleted successfully',
    });
});

/**
 * @desc    Stock in
 * @route   POST /api/inventory/stock-in
 */
exports.stockIn = asyncHandler(async (req, res, next) => {
    const { item: itemId, quantity, rate, supplier, invoiceNumber, remarks } = req.body;

    const item = await Inventory.findById(itemId);
    if (!item) {
        return next(new ErrorResponse('Item not found', 404));
    }

    const previousQuantity = item.quantity;
    item.quantity += quantity;
    item.lastPurchaseRate = rate;
    item.lastPurchaseDate = new Date();
    await item.save();

    const transaction = await InventoryTransaction.create({
        item: itemId,
        transactionType: 'stock-in',
        quantity,
        previousQuantity,
        newQuantity: item.quantity,
        rate,
        totalAmount: quantity * rate,
        supplier,
        invoiceNumber,
        remarks,
        createdBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        data: transaction,
    });
});

/**
 * @desc    Stock out
 * @route   POST /api/inventory/stock-out
 */
exports.stockOut = asyncHandler(async (req, res, next) => {
    const { item: itemId, quantity, department, issuedTo, reason, remarks } = req.body;

    const item = await Inventory.findById(itemId);
    if (!item) {
        return next(new ErrorResponse('Item not found', 404));
    }

    if (item.quantity < quantity) {
        return next(new ErrorResponse('Insufficient stock', 400));
    }

    const previousQuantity = item.quantity;
    item.quantity -= quantity;
    await item.save();

    const transaction = await InventoryTransaction.create({
        item: itemId,
        transactionType: 'stock-out',
        quantity: -quantity,
        previousQuantity,
        newQuantity: item.quantity,
        department,
        issuedTo,
        reason,
        remarks,
        createdBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        data: transaction,
    });
});

/**
 * @desc    Get low stock items
 * @route   GET /api/inventory/low-stock
 */
exports.getLowStockItems = asyncHandler(async (req, res, next) => {
    const items = await Inventory.find({
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
    }).sort({ quantity: 1 });

    res.status(200).json({
        success: true,
        count: items.length,
        data: items,
    });
});

/**
 * @desc    Get inventory transactions
 * @route   GET /api/inventory/transactions
 */
exports.getTransactions = asyncHandler(async (req, res, next) => {
    const { item, type, page = 1, limit = 50 } = req.query;

    const query = {};
    if (item) query.item = item;
    if (type) query.transactionType = type;

    const skip = (page - 1) * limit;

    const transactions = await InventoryTransaction.find(query)
        .populate('item', 'itemName itemCode')
        .populate('createdBy', 'profile.firstName profile.lastName')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions,
    });
});
