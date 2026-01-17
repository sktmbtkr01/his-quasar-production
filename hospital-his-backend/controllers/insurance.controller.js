const Insurance = require('../models/Insurance');
const InsuranceProvider = require('../models/InsuranceProvider');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Create insurance claim
 * @route   POST /api/insurance/claims
 */
exports.createClaim = asyncHandler(async (req, res, next) => {
    const claim = await Insurance.create(req.body);
    await claim.populate(['patient', 'provider']);

    res.status(201).json({
        success: true,
        data: claim,
    });
});

/**
 * @desc    Get all claims
 * @route   GET /api/insurance/claims
 */
exports.getAllClaims = asyncHandler(async (req, res, next) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const claims = await Insurance.find(query)
        .populate('patient', 'patientId firstName lastName')
        .populate('provider', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ submittedDate: -1 });

    const total = await Insurance.countDocuments(query);

    res.status(200).json({
        success: true,
        count: claims.length,
        total,
        page: parseInt(page),
        data: claims,
    });
});

/**
 * @desc    Get claim by ID
 * @route   GET /api/insurance/claims/:id
 */
exports.getClaimById = asyncHandler(async (req, res, next) => {
    const claim = await Insurance.findById(req.params.id)
        .populate('patient')
        .populate('provider')
        .populate('admission')
        .populate('handledBy', 'profile');

    if (!claim) {
        return next(new ErrorResponse('Claim not found', 404));
    }

    res.status(200).json({
        success: true,
        data: claim,
    });
});

/**
 * @desc    Update claim
 * @route   PUT /api/insurance/claims/:id
 */
exports.updateClaim = asyncHandler(async (req, res, next) => {
    req.body.handledBy = req.user.id;

    const claim = await Insurance.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!claim) {
        return next(new ErrorResponse('Claim not found', 404));
    }

    res.status(200).json({
        success: true,
        data: claim,
    });
});

/**
 * @desc    Request pre-authorization
 * @route   POST /api/insurance/pre-authorization
 */
exports.requestPreAuth = asyncHandler(async (req, res, next) => {
    const claim = await Insurance.create({
        ...req.body,
        status: 'pending',
    });

    res.status(201).json({
        success: true,
        message: 'Pre-authorization request submitted',
        data: claim,
    });
});

/**
 * @desc    Get insurance providers
 * @route   GET /api/insurance/providers
 */
exports.getProviders = asyncHandler(async (req, res, next) => {
    const providers = await InsuranceProvider.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: providers.length,
        data: providers,
    });
});

/**
 * @desc    Add insurance provider
 * @route   POST /api/insurance/providers
 */
exports.addProvider = asyncHandler(async (req, res, next) => {
    const provider = await InsuranceProvider.create(req.body);

    res.status(201).json({
        success: true,
        data: provider,
    });
});
