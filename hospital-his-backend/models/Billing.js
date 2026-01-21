const mongoose = require('mongoose');
const { PAYMENT_STATUS, VISIT_TYPES } = require('../config/constants');

/**
 * Billing Model
 * Represents bills and invoices
 */

const billingSchema = new mongoose.Schema(
    {
        billNumber: {
            type: String,
            unique: true,
            required: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient is required'],
        },
        visit: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'visitModel',
            required: [true, 'Visit reference is required'],
        },
        visitModel: {
            type: String,
            enum: ['Appointment', 'Admission', 'Emergency'],
            required: true,
        },
        visitType: {
            type: String,
            enum: Object.values(VISIT_TYPES),
            required: [true, 'Visit type is required'],
        },
        billDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['draft', 'finalized', 'cancelled'],
            default: 'draft',
        },
        items: [
            {
                itemType: {
                    type: String,
                    enum: ['consultation', 'procedure', 'lab', 'radiology', 'medicine', 'bed', 'surgery', 'nursing', 'other'],
                    required: true,
                },
                itemReference: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                description: {
                    type: String,
                    required: true,
                    trim: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, 'Quantity must be at least 1'],
                },
                rate: {
                    type: Number,
                    required: true,
                    min: [0, 'Rate cannot be negative'],
                },
                amount: {
                    type: Number,
                    required: true,
                },
                discount: {
                    type: Number,
                    default: 0,
                },
                tax: {
                    type: Number,
                    default: 0,
                },
                netAmount: {
                    type: Number,
                    required: true,
                },
                isBilled: {
                    type: Boolean,
                    default: true,
                },
                billedAt: {
                    type: Date,
                    default: Date.now,
                },
                isSystemGenerated: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
            default: 0,
        },
        totalDiscount: {
            type: Number,
            default: 0,
        },
        totalTax: {
            type: Number,
            default: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
            default: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        balanceAmount: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.PENDING,
        },
        insuranceClaim: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Insurance',
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
billingSchema.index({ billNumber: 1 });
billingSchema.index({ patient: 1 });
billingSchema.index({ visit: 1 });
billingSchema.index({ paymentStatus: 1 });
billingSchema.index({ billDate: -1 });

// Auto-generate billNumber before saving
billingSchema.pre('save', async function (next) {
    if (this.isNew) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await mongoose.model('Billing').countDocuments();
        this.billNumber = `BILL${dateStr}${String(count + 1).padStart(5, '0')}`;
    }

    // Calculate totals
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.totalDiscount = this.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    this.totalTax = this.items.reduce((sum, item) => sum + (item.tax || 0), 0);
    this.grandTotal = this.subtotal - this.totalDiscount + this.totalTax;
    this.balanceAmount = this.grandTotal - this.paidAmount;

    // Update payment status
    if (this.paidAmount >= this.grandTotal) {
        this.paymentStatus = PAYMENT_STATUS.PAID;
    } else if (this.paidAmount > 0) {
        this.paymentStatus = PAYMENT_STATUS.PARTIAL;
    } else {
        this.paymentStatus = PAYMENT_STATUS.PENDING;
    }

    next();
});

const Billing = mongoose.model('Billing', billingSchema);

module.exports = Billing;
