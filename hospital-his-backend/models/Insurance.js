const mongoose = require('mongoose');
const { INSURANCE_CLAIM_STATUS } = require('../config/constants');

/**
 * Insurance Model
 * Represents insurance claims
 */

const insuranceSchema = new mongoose.Schema(
    {
        claimNumber: {
            type: String,
            unique: true,
            required: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient is required'],
        },
        admission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admission',
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InsuranceProvider',
            required: [true, 'Insurance provider is required'],
        },
        policyNumber: {
            type: String,
            required: [true, 'Policy number is required'],
            trim: true,
        },
        claimAmount: {
            type: Number,
            required: [true, 'Claim amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        approvedAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: Object.values(INSURANCE_CLAIM_STATUS),
            default: INSURANCE_CLAIM_STATUS.PENDING,
        },
        submittedDate: {
            type: Date,
            default: Date.now,
        },
        approvalDate: {
            type: Date,
        },
        settlementDate: {
            type: Date,
        },
        documents: [{ type: String }],
        remarks: {
            type: String,
            trim: true,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
        handledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
insuranceSchema.index({ claimNumber: 1 });
insuranceSchema.index({ patient: 1 });
insuranceSchema.index({ status: 1 });
insuranceSchema.index({ provider: 1 });
insuranceSchema.index({ submittedDate: -1 });

// Auto-generate claimNumber before saving
insuranceSchema.pre('save', async function (next) {
    if (this.isNew) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await mongoose.model('Insurance').countDocuments();
        this.claimNumber = `CLM${dateStr}${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

const Insurance = mongoose.model('Insurance', insuranceSchema);

module.exports = Insurance;
