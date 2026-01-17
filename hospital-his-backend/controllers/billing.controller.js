const Billing = require('../models/Billing');
const BillingItem = require('../models/BillingItem');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Generate bill
 * @route   POST /api/billing/generate
 */
exports.generateBill = asyncHandler(async (req, res, next) => {
    req.body.generatedBy = req.user.id;

    const bill = await Billing.create(req.body);
    await bill.populate(['patient', 'generatedBy']);

    res.status(201).json({
        success: true,
        data: bill,
    });
});

/**
 * @desc    Get all bills
 * @route   GET /api/billing/bills
 */
exports.getAllBills = asyncHandler(async (req, res, next) => {
    const { paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (page - 1) * limit;

    const bills = await Billing.find(query)
        .populate('patient', 'patientId firstName lastName')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ billDate: -1 });

    const total = await Billing.countDocuments(query);

    res.status(200).json({
        success: true,
        count: bills.length,
        total,
        page: parseInt(page),
        data: bills,
    });
});

/**
 * @desc    Get bill by ID
 * @route   GET /api/billing/bills/:id
 */
exports.getBillById = asyncHandler(async (req, res, next) => {
    const bill = await Billing.findById(req.params.id)
        .populate('patient')
        .populate('generatedBy', 'profile');

    if (!bill) {
        return next(new ErrorResponse('Bill not found', 404));
    }

    res.status(200).json({
        success: true,
        data: bill,
    });
});

/**
 * @desc    Update bill
 * @route   PUT /api/billing/bills/:id
 */
exports.updateBill = asyncHandler(async (req, res, next) => {
    const bill = await Billing.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!bill) {
        return next(new ErrorResponse('Bill not found', 404));
    }

    res.status(200).json({
        success: true,
        data: bill,
    });
});

/**
 * @desc    Get patient bills
 * @route   GET /api/billing/patient/:patientId
 */
exports.getPatientBills = asyncHandler(async (req, res, next) => {
    const bills = await Billing.find({ patient: req.params.patientId })
        .sort({ billDate: -1 });

    res.status(200).json({
        success: true,
        count: bills.length,
        data: bills,
    });
});

/**
 * @desc    Get pending bills
 * @route   GET /api/billing/pending
 */
exports.getPendingBills = asyncHandler(async (req, res, next) => {
    const bills = await Billing.find({ paymentStatus: { $in: ['pending', 'partial'] } })
        .populate('patient', 'patientId firstName lastName')
        .sort({ billDate: -1 });

    res.status(200).json({
        success: true,
        count: bills.length,
        data: bills,
    });
});

/**
 * @desc    Get billing dashboard
 * @route   GET /api/billing/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCollection, pendingAmount, todayBills] = await Promise.all([
        Billing.aggregate([
            { $match: { billDate: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]),
        Billing.aggregate([
            { $match: { paymentStatus: { $in: ['pending', 'partial'] } } },
            { $group: { _id: null, total: { $sum: '$balanceAmount' } } },
        ]),
        Billing.countDocuments({ billDate: { $gte: today } }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            todayCollection: todayCollection[0]?.total || 0,
            pendingAmount: pendingAmount[0]?.total || 0,
            todayBills,
        },
    });
});

/**
 * @desc    Cancel bill
 * @route   POST /api/billing/bills/:id/cancel
 */
exports.cancelBill = asyncHandler(async (req, res, next) => {
    const bill = await Billing.findById(req.params.id);

    if (!bill) {
        return next(new ErrorResponse('Bill not found', 404));
    }

    bill.paymentStatus = 'cancelled';
    await bill.save();

    res.status(200).json({
        success: true,
        message: 'Bill cancelled successfully',
    });
});
