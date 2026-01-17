const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { APPOINTMENT_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Create a new appointment
 * @route   POST /api/opd/appointments
 */
exports.createAppointment = asyncHandler(async (req, res, next) => {
    req.body.createdBy = req.user.id;

    const appointment = await Appointment.create(req.body);
    await appointment.populate(['patient', 'doctor', 'department']);

    res.status(201).json({
        success: true,
        data: appointment,
    });
});

/**
 * @desc    Get all appointments
 * @route   GET /api/opd/appointments
 */
exports.getAllAppointments = asyncHandler(async (req, res, next) => {
    const { date, doctor, department, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (date) query.scheduledDate = new Date(date);
    if (doctor) query.doctor = doctor;
    if (department) query.department = department;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
        .populate('patient', 'patientId firstName lastName phone')
        .populate('doctor', 'profile.firstName profile.lastName')
        .populate('department', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ scheduledDate: 1, tokenNumber: 1 });

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
        success: true,
        count: appointments.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: appointments,
    });
});

/**
 * @desc    Get appointment by ID
 * @route   GET /api/opd/appointments/:id
 */
exports.getAppointmentById = asyncHandler(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate('patient')
        .populate('doctor', 'profile')
        .populate('department');

    if (!appointment) {
        return next(new ErrorResponse('Appointment not found', 404));
    }

    res.status(200).json({
        success: true,
        data: appointment,
    });
});

/**
 * @desc    Update appointment
 * @route   PUT /api/opd/appointments/:id
 */
exports.updateAppointment = asyncHandler(async (req, res, next) => {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate(['patient', 'doctor', 'department']);

    if (!appointment) {
        return next(new ErrorResponse('Appointment not found', 404));
    }

    res.status(200).json({
        success: true,
        data: appointment,
    });
});

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/opd/appointments/:id
 */
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new ErrorResponse('Appointment not found', 404));
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    await appointment.save();

    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
    });
});

/**
 * @desc    Check-in patient
 * @route   PUT /api/opd/appointments/:id/checkin
 */
exports.checkInPatient = asyncHandler(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new ErrorResponse('Appointment not found', 404));
    }

    // Generate token number for the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tokenCount = await Appointment.countDocuments({
        doctor: appointment.doctor,
        scheduledDate: { $gte: today },
        status: { $in: [APPOINTMENT_STATUS.CHECKED_IN, APPOINTMENT_STATUS.IN_CONSULTATION, APPOINTMENT_STATUS.COMPLETED] },
    });

    appointment.status = APPOINTMENT_STATUS.CHECKED_IN;
    appointment.tokenNumber = tokenCount + 1;
    await appointment.save();

    res.status(200).json({
        success: true,
        data: appointment,
    });
});

/**
 * @desc    Get OPD queue
 * @route   GET /api/opd/queue
 */
exports.getOPDQueue = asyncHandler(async (req, res, next) => {
    const { doctor, department } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
        scheduledDate: { $gte: today },
        status: { $in: [APPOINTMENT_STATUS.CHECKED_IN, APPOINTMENT_STATUS.SCHEDULED] },
    };

    if (doctor) query.doctor = doctor;
    if (department) query.department = department;

    const queue = await Appointment.find(query)
        .populate('patient', 'patientId firstName lastName')
        .populate('doctor', 'profile.firstName profile.lastName')
        .sort({ tokenNumber: 1, scheduledTime: 1 });

    res.status(200).json({
        success: true,
        count: queue.length,
        data: queue,
    });
});

/**
 * @desc    Get OPD dashboard stats
 * @route   GET /api/opd/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats, statusBreakdown] = await Promise.all([
        Appointment.countDocuments({
            scheduledDate: { $gte: today, $lt: tomorrow },
        }),
        Appointment.aggregate([
            { $match: { scheduledDate: { $gte: today, $lt: tomorrow } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalToday: todayStats,
            statusBreakdown: statusBreakdown.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
        },
    });
});
