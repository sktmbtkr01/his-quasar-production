const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const { ADMISSION_STATUS, BED_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Create a new admission
 * @route   POST /api/ipd/admissions
 */
exports.createAdmission = asyncHandler(async (req, res, next) => {
    req.body.createdBy = req.user.id;

    const admission = await Admission.create(req.body);

    // Update bed status if bed is assigned
    if (req.body.bed) {
        await Bed.findByIdAndUpdate(req.body.bed, {
            status: BED_STATUS.OCCUPIED,
            currentPatient: req.body.patient,
            currentAdmission: admission._id,
        });
    }

    await admission.populate(['patient', 'doctor', 'department', 'ward', 'bed']);

    res.status(201).json({
        success: true,
        data: admission,
    });
});

/**
 * @desc    Get all admissions
 * @route   GET /api/ipd/admissions
 */
exports.getAllAdmissions = asyncHandler(async (req, res, next) => {
    const { status, doctor, department, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (department) query.department = department;

    const skip = (page - 1) * limit;

    const admissions = await Admission.find(query)
        .populate('patient', 'patientId firstName lastName phone')
        .populate('doctor', 'profile.firstName profile.lastName')
        .populate('department', 'name')
        .populate('ward', 'name')
        .populate('bed', 'bedNumber')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ admissionDate: -1 });

    const total = await Admission.countDocuments(query);

    res.status(200).json({
        success: true,
        count: admissions.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: admissions,
    });
});

/**
 * @desc    Get admission by ID
 * @route   GET /api/ipd/admissions/:id
 */
exports.getAdmissionById = asyncHandler(async (req, res, next) => {
    const admission = await Admission.findById(req.params.id)
        .populate('patient')
        .populate('doctor', 'profile')
        .populate('department')
        .populate('ward')
        .populate('bed');

    if (!admission) {
        return next(new ErrorResponse('Admission not found', 404));
    }

    res.status(200).json({
        success: true,
        data: admission,
    });
});

/**
 * @desc    Update admission
 * @route   PUT /api/ipd/admissions/:id
 */
exports.updateAdmission = asyncHandler(async (req, res, next) => {
    const admission = await Admission.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate(['patient', 'doctor', 'department', 'ward', 'bed']);

    if (!admission) {
        return next(new ErrorResponse('Admission not found', 404));
    }

    res.status(200).json({
        success: true,
        data: admission,
    });
});

/**
 * @desc    Discharge patient
 * @route   POST /api/ipd/admissions/:id/discharge
 */
exports.dischargePatient = asyncHandler(async (req, res, next) => {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
        return next(new ErrorResponse('Admission not found', 404));
    }

    admission.status = ADMISSION_STATUS.DISCHARGED;
    admission.dischargeDate = new Date();
    await admission.save();

    // Free up the bed
    if (admission.bed) {
        await Bed.findByIdAndUpdate(admission.bed, {
            status: BED_STATUS.AVAILABLE,
            currentPatient: null,
            currentAdmission: null,
        });
    }

    res.status(200).json({
        success: true,
        message: 'Patient discharged successfully',
        data: admission,
    });
});

/**
 * @desc    Get admitted patients
 * @route   GET /api/ipd/patients
 */
exports.getAdmittedPatients = asyncHandler(async (req, res, next) => {
    const admissions = await Admission.find({ status: ADMISSION_STATUS.ADMITTED })
        .populate('patient', 'patientId firstName lastName phone')
        .populate('doctor', 'profile.firstName profile.lastName')
        .populate('ward', 'name')
        .populate('bed', 'bedNumber')
        .sort({ admissionDate: -1 });

    res.status(200).json({
        success: true,
        count: admissions.length,
        data: admissions,
    });
});

/**
 * @desc    Get IPD dashboard stats
 * @route   GET /api/ipd/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
    const [totalAdmitted, todayAdmissions, todayDischarges] = await Promise.all([
        Admission.countDocuments({ status: ADMISSION_STATUS.ADMITTED }),
        Admission.countDocuments({
            admissionDate: { $gte: new Date().setHours(0, 0, 0, 0) },
        }),
        Admission.countDocuments({
            dischargeDate: { $gte: new Date().setHours(0, 0, 0, 0) },
        }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalAdmitted,
            todayAdmissions,
            todayDischarges,
        },
    });
});
