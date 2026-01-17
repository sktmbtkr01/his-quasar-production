const mongoose = require('mongoose');

/**
 * Inventory Model
 * Represents hospital inventory items (non-pharmacy)
 */

const inventorySchema = new mongoose.Schema(
    {
        itemCode: {
            type: String,
            unique: true,
            required: [true, 'Item code is required'],
            trim: true,
        },
        itemName: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['consumables', 'equipment', 'instruments', 'linen', 'stationery', 'housekeeping', 'other'],
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Quantity cannot be negative'],
        },
        reorderLevel: {
            type: Number,
            default: 10,
        },
        location: {
            type: String,
            trim: true,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
        },
        supplier: {
            type: String,
            trim: true,
        },
        lastPurchaseDate: {
            type: Date,
        },
        lastPurchaseRate: {
            type: Number,
            min: [0, 'Rate cannot be negative'],
        },
        averageRate: {
            type: Number,
            min: [0, 'Rate cannot be negative'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
inventorySchema.index({ itemCode: 1 });
inventorySchema.index({ itemName: 'text' });
inventorySchema.index({ category: 1 });
inventorySchema.index({ department: 1 });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function () {
    if (this.quantity <= 0) return 'out-of-stock';
    if (this.quantity <= this.reorderLevel) return 'low-stock';
    return 'available';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
