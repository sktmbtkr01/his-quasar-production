const PharmacyDispense = require('../models/PharmacyDispense');
const PharmacyInventory = require('../models/PharmacyInventory');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Dispense medicines
 * @route   POST /api/pharmacy/dispense
 */
exports.dispenseMedicines = asyncHandler(async (req, res, next) => {
    const dispense = await PharmacyDispense.create({
        ...req.body,
        dispensedBy: req.user.id,
    });

    // Mark prescription as dispensed
    if (req.body.prescription) {
        await Prescription.findByIdAndUpdate(req.body.prescription, {
            isDispensed: true,
            dispensedBy: req.user.id,
            dispensedAt: new Date(),
        });
    }

    await dispense.populate(['patient', 'prescription', 'items.medicine']);

    res.status(201).json({
        success: true,
        data: dispense,
    });
});

/**
 * @desc    Get pharmacy queue
 * @route   GET /api/pharmacy/queue
 */
exports.getPharmacyQueue = asyncHandler(async (req, res, next) => {
    const queue = await Prescription.find({ isDispensed: false })
        .populate('patient', 'patientId firstName lastName')
        .populate('doctor', 'profile.firstName profile.lastName')
        .sort({ createdAt: 1 });

    res.status(200).json({
        success: true,
        count: queue.length,
        data: queue,
    });
});

/**
 * @desc    Get pharmacy inventory
 * @route   GET /api/pharmacy/inventory
 */
exports.getInventory = asyncHandler(async (req, res, next) => {
    const { status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const inventory = await PharmacyInventory.find(query)
        .populate('medicine', 'name genericName form strength')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ expiryDate: 1 });

    const total = await PharmacyInventory.countDocuments(query);

    res.status(200).json({
        success: true,
        count: inventory.length,
        total,
        page: parseInt(page),
        data: inventory,
    });
});

/**
 * @desc    Add stock
 * @route   POST /api/pharmacy/inventory
 */
exports.addStock = asyncHandler(async (req, res, next) => {
    const stock = await PharmacyInventory.create(req.body);

    res.status(201).json({
        success: true,
        data: stock,
    });
});

/**
 * @desc    Update stock
 * @route   PUT /api/pharmacy/inventory/:id
 */
exports.updateStock = asyncHandler(async (req, res, next) => {
    const stock = await PharmacyInventory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!stock) {
        return next(new ErrorResponse('Stock not found', 404));
    }

    res.status(200).json({
        success: true,
        data: stock,
    });
});

/**
 * @desc    Get expiry alerts
 * @route   GET /api/pharmacy/expiry-alerts
 */
exports.getExpiryAlerts = asyncHandler(async (req, res, next) => {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const expiringStock = await PharmacyInventory.find({
        expiryDate: { $lte: threeMonthsFromNow },
        quantity: { $gt: 0 },
    })
        .populate('medicine', 'name genericName')
        .sort({ expiryDate: 1 });

    res.status(200).json({
        success: true,
        count: expiringStock.length,
        data: expiringStock,
    });
});

/**
 * @desc    Get pharmacy dashboard
 * @route   GET /api/pharmacy/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingPrescriptions, dispensedToday, lowStock, expiringSoon] = await Promise.all([
        Prescription.countDocuments({ isDispensed: false }),
        PharmacyDispense.countDocuments({ dispensedAt: { $gte: today } }),
        PharmacyInventory.countDocuments({ status: 'low-stock' }),
        PharmacyInventory.countDocuments({
            expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            quantity: { $gt: 0 },
        }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            pendingPrescriptions,
            dispensedToday,
            lowStock,
            expiringSoon,
        },
    });
});

/**
 * @desc    Get medicines catalog
 * @route   GET /api/pharmacy/medicines
 */
exports.getMedicines = asyncHandler(async (req, res, next) => {
    const { search } = req.query;

    let query = { isActive: true };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { genericName: { $regex: search, $options: 'i' } },
        ];
    }

    const medicines = await Medicine.find(query).limit(50).sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: medicines.length,
        data: medicines,
    });
});
