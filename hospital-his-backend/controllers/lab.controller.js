const LabTest = require('../models/LabTest');
const LabTestMaster = require('../models/LabTestMaster');
const { LAB_TEST_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Create lab order
 * @route   POST /api/lab/orders
 */
exports.createLabOrder = asyncHandler(async (req, res, next) => {
    req.body.orderedBy = req.user.id;

    const labOrder = await LabTest.create(req.body);
    await labOrder.populate(['patient', 'orderedBy', 'test']);

    res.status(201).json({
        success: true,
        data: labOrder,
    });
});

/**
 * @desc    Get all lab orders
 * @route   GET /api/lab/orders
 */
exports.getAllLabOrders = asyncHandler(async (req, res, next) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await LabTest.find(query)
        .populate('patient', 'patientId firstName lastName')
        .populate('orderedBy', 'profile.firstName profile.lastName')
        .populate('test', 'testName testCode')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await LabTest.countDocuments(query);

    res.status(200).json({
        success: true,
        count: orders.length,
        total,
        page: parseInt(page),
        data: orders,
    });
});

/**
 * @desc    Get lab order by ID
 * @route   GET /api/lab/orders/:id
 */
exports.getLabOrderById = asyncHandler(async (req, res, next) => {
    const order = await LabTest.findById(req.params.id)
        .populate('patient')
        .populate('orderedBy', 'profile')
        .populate('test')
        .populate('performedBy', 'profile');

    if (!order) {
        return next(new ErrorResponse('Lab order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

/**
 * @desc    Update lab order
 * @route   PUT /api/lab/orders/:id
 */
exports.updateLabOrder = asyncHandler(async (req, res, next) => {
    const order = await LabTest.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!order) {
        return next(new ErrorResponse('Lab order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

/**
 * @desc    Collect sample
 * @route   POST /api/lab/orders/:id/collect-sample
 */
exports.collectSample = asyncHandler(async (req, res, next) => {
    const order = await LabTest.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Lab order not found', 404));
    }

    order.status = LAB_TEST_STATUS.SAMPLE_COLLECTED;
    order.sampleCollectedAt = new Date();
    order.sampleCollectedBy = req.user.id;
    await order.save();

    res.status(200).json({
        success: true,
        data: order,
    });
});

/**
 * @desc    Enter lab results
 * @route   POST /api/lab/orders/:id/enter-results
 */
exports.enterResults = asyncHandler(async (req, res, next) => {
    const order = await LabTest.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Lab order not found', 404));
    }

    order.results = req.body.results;
    order.remarks = req.body.remarks;
    order.status = LAB_TEST_STATUS.COMPLETED;
    order.performedBy = req.user.id;
    order.completedAt = new Date();
    await order.save();

    res.status(200).json({
        success: true,
        data: order,
    });
});

/**
 * @desc    Generate lab report
 * @route   POST /api/lab/orders/:id/generate-report
 */
exports.generateReport = asyncHandler(async (req, res, next) => {
    const order = await LabTest.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Lab order not found', 404));
    }

    // TODO: Generate PDF report
    order.isReportGenerated = true;
    order.reportUrl = `/reports/lab/${order._id}.pdf`;
    await order.save();

    res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: order,
    });
});

/**
 * @desc    Get lab queue
 * @route   GET /api/lab/queue
 */
exports.getLabQueue = asyncHandler(async (req, res, next) => {
    const queue = await LabTest.find({
        status: { $in: [LAB_TEST_STATUS.ORDERED, LAB_TEST_STATUS.SAMPLE_COLLECTED, LAB_TEST_STATUS.IN_PROGRESS] },
    })
        .populate('patient', 'patientId firstName lastName')
        .populate('test', 'testName')
        .sort({ createdAt: 1 });

    res.status(200).json({
        success: true,
        count: queue.length,
        data: queue,
    });
});

/**
 * @desc    Get lab dashboard stats
 * @route   GET /api/lab/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, completed, statusBreakdown] = await Promise.all([
        LabTest.countDocuments({ status: { $in: [LAB_TEST_STATUS.ORDERED, LAB_TEST_STATUS.SAMPLE_COLLECTED] } }),
        LabTest.countDocuments({ completedAt: { $gte: today } }),
        LabTest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);

    res.status(200).json({
        success: true,
        data: {
            pending,
            completedToday: completed,
            statusBreakdown: statusBreakdown.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
        },
    });
});

/**
 * @desc    Get available lab tests
 * @route   GET /api/lab/tests
 */
exports.getLabTests = asyncHandler(async (req, res, next) => {
    const tests = await LabTestMaster.find({ isActive: true }).sort({ testName: 1 });

    res.status(200).json({
        success: true,
        count: tests.length,
        data: tests,
    });
});
