const Surgery = require('../models/Surgery');
const { SURGERY_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Schedule surgery
 * @route   POST /api/surgery/schedule
 */
exports.scheduleSurgery = asyncHandler(async (req, res, next) => {
    const surgery = await Surgery.create(req.body);
    await surgery.populate(['patient', 'surgeon', 'admission']);

    res.status(201).json({
        success: true,
        data: surgery,
    });
});

/**
 * @desc    Get all schedules
 * @route   GET /api/surgery/schedules
 */
exports.getAllSchedules = asyncHandler(async (req, res, next) => {
    const { status, date, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (date) query.scheduledDate = new Date(date);

    const skip = (page - 1) * limit;

    const schedules = await Surgery.find(query)
        .populate('patient', 'patientId firstName lastName')
        .populate('surgeon', 'profile.firstName profile.lastName')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ scheduledDate: 1, scheduledTime: 1 });

    const total = await Surgery.countDocuments(query);

    res.status(200).json({
        success: true,
        count: schedules.length,
        total,
        page: parseInt(page),
        data: schedules,
    });
});

/**
 * @desc    Get schedule by ID
 * @route   GET /api/surgery/schedules/:id
 */
exports.getScheduleById = asyncHandler(async (req, res, next) => {
    const surgery = await Surgery.findById(req.params.id)
        .populate('patient')
        .populate('surgeon', 'profile')
        .populate('assistantSurgeons', 'profile')
        .populate('anesthetist', 'profile')
        .populate('nurses', 'profile');

    if (!surgery) {
        return next(new ErrorResponse('Surgery schedule not found', 404));
    }

    res.status(200).json({
        success: true,
        data: surgery,
    });
});

/**
 * @desc    Update schedule
 * @route   PUT /api/surgery/schedules/:id
 */
exports.updateSchedule = asyncHandler(async (req, res, next) => {
    const surgery = await Surgery.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!surgery) {
        return next(new ErrorResponse('Surgery schedule not found', 404));
    }

    res.status(200).json({
        success: true,
        data: surgery,
    });
});

/**
 * @desc    Get OT roster
 * @route   GET /api/surgery/ot-roster
 */
exports.getOTRoster = asyncHandler(async (req, res, next) => {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const roster = await Surgery.find({
        scheduledDate: { $gte: targetDate, $lt: nextDay },
        status: { $ne: SURGERY_STATUS.CANCELLED },
    })
        .populate('patient', 'patientId firstName lastName')
        .populate('surgeon', 'profile.firstName profile.lastName')
        .sort({ scheduledTime: 1 });

    res.status(200).json({
        success: true,
        count: roster.length,
        data: roster,
    });
});

/**
 * @desc    Get surgery dashboard
 * @route   GET /api/surgery/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayScheduled, inProgress, completed] = await Promise.all([
        Surgery.countDocuments({
            scheduledDate: { $gte: today, $lt: tomorrow },
        }),
        Surgery.countDocuments({ status: SURGERY_STATUS.IN_PROGRESS }),
        Surgery.countDocuments({
            status: SURGERY_STATUS.COMPLETED,
            actualEndTime: { $gte: today },
        }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            todayScheduled,
            inProgress,
            completedToday: completed,
        },
    });
});

/**
 * @desc    Complete surgery
 * @route   POST /api/surgery/schedules/:id/complete
 */
exports.completeSurgery = asyncHandler(async (req, res, next) => {
    const surgery = await Surgery.findById(req.params.id);

    if (!surgery) {
        return next(new ErrorResponse('Surgery not found', 404));
    }

    surgery.status = SURGERY_STATUS.COMPLETED;
    surgery.actualEndTime = new Date();
    surgery.complications = req.body.complications;
    surgery.postOpInstructions = req.body.postOpInstructions;
    await surgery.save();

    res.status(200).json({
        success: true,
        data: surgery,
    });
});
