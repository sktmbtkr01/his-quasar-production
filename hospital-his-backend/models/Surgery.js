const mongoose = require('mongoose');
const { SURGERY_STATUS } = require('../config/constants');

/**
 * Surgery Model
 * Represents OT schedules and surgery records
 */

const surgerySchema = new mongoose.Schema(
    {
        surgeryNumber: {
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
            required: [true, 'Admission is required'],
        },
        surgeon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Surgeon is required'],
        },
        assistantSurgeons: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        anesthetist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        nurses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        otNumber: {
            type: String,
            trim: true,
        },
        scheduledDate: {
            type: Date,
            required: [true, 'Scheduled date is required'],
        },
        scheduledTime: {
            type: String,
            required: [true, 'Scheduled time is required'],
        },
        actualStartTime: {
            type: Date,
        },
        actualEndTime: {
            type: Date,
        },
        surgeryType: {
            type: String,
            required: [true, 'Surgery type is required'],
            trim: true,
        },
        diagnosis: {
            type: String,
            trim: true,
        },
        procedure: {
            type: String,
            trim: true,
        },
        anesthesiaType: {
            type: String,
            enum: ['general', 'regional', 'local', 'sedation'],
        },
        complications: {
            type: String,
            trim: true,
        },
        postOpInstructions: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(SURGERY_STATUS),
            default: SURGERY_STATUS.SCHEDULED,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
surgerySchema.index({ surgeryNumber: 1 });
surgerySchema.index({ patient: 1 });
surgerySchema.index({ surgeon: 1 });
surgerySchema.index({ scheduledDate: 1 });
surgerySchema.index({ status: 1 });
surgerySchema.index({ otNumber: 1, scheduledDate: 1 });

// Auto-generate surgeryNumber before saving
surgerySchema.pre('save', async function (next) {
    if (this.isNew) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await mongoose.model('Surgery').countDocuments();
        this.surgeryNumber = `SRG${dateStr}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

const Surgery = mongoose.model('Surgery', surgerySchema);

module.exports = Surgery;
